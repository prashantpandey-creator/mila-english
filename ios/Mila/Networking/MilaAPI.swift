import Foundation

enum MilaAPIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case server(Int, String)
    case emptyReply

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "The FluentMitra service address is invalid."
        case .invalidResponse: return "FluentMitra returned an unreadable response."
        case let .server(code, message): return message.isEmpty ? "FluentMitra returned error \(code)." : message
        case .emptyReply: return "FluentMitra did not return a reply. Please try again."
        }
    }
}

actor MilaAPI {
    static let shared = MilaAPI()

    static let baseURL: URL = {
        if let value = Bundle.main.object(forInfoDictionaryKey: "MilaBaseURL") as? String,
           let url = URL(string: value) {
            return url
        }
        return URL(string: "https://mila.purangpt.com")!
    }()

    private let session: URLSession
    private let decoder = JSONDecoder()

    init() {
        let configuration = URLSessionConfiguration.default
        configuration.httpCookieStorage = .shared
        configuration.httpCookieAcceptPolicy = .always
        configuration.httpShouldSetCookies = true
        // The private tutor can have a cold-start before it begins streaming.
        // Keep the native client alive long enough to receive that first token.
        configuration.timeoutIntervalForRequest = 180
        configuration.timeoutIntervalForResource = 240
        configuration.waitsForConnectivity = true
        session = URLSession(configuration: configuration)
    }

    nonisolated static func webURL(path: String) -> URL {
        URL(string: path, relativeTo: baseURL)!.absoluteURL
    }

    func currentUser() async throws -> UserProfile {
        try await jsonRequest(path: "/api/users/me", method: "GET")
    }

    func createGuest() async throws -> UserProfile {
        try await jsonRequest(path: "/api/auth/guest", method: "POST")
    }

    func login(email: String, password: String) async throws -> UserProfile {
        try await jsonRequest(
            path: "/api/auth/login",
            method: "POST",
            body: ["email": email, "password": password]
        )
    }

    func register(name: String, email: String, password: String) async throws -> UserProfile {
        try await jsonRequest(
            path: "/api/auth/register",
            method: "POST",
            body: [
                "name": name,
                "email": email,
                "password": password,
                "learnerCategory": "adult_learner",
                "nativeLanguage": "ru",
                "level": "pending",
            ]
        )
    }

    func requestPasswordReset(email: String) async throws {
        let (data, response) = try await dataRequest(
            path: "/api/auth/forgot-password",
            method: "POST",
            body: ["email": email]
        )
        try validate(response: response, data: data)
    }

    func logout() async throws {
        let (_, response) = try await dataRequest(path: "/api/auth/logout", method: "POST")
        try validate(response: response, data: Data())
    }

    func deleteAccount() async throws {
        let (_, response) = try await dataRequest(
            path: "/api/users/me",
            method: "DELETE",
            body: ["confirmation": "DELETE"]
        )
        try validate(response: response, data: Data())
    }

    func progress() async throws -> ProgressSummary {
        try await jsonRequest(path: "/api/progress", method: "GET")
    }

    func words() async throws -> [MilaWord] {
        try await jsonRequest(path: "/api/words", method: "GET")
    }

    func lessons() async throws -> [MilaLesson] {
        try await jsonRequest(path: "/api/lessons", method: "GET")
    }

    func sendChat(
        text: String,
        language: AppLanguage,
        surface: String = "chat",
        pathname: String = "/chat"
    ) async throws -> String {
        guard let url = URL(string: "/api/chat", relativeTo: Self.baseURL)?.absoluteURL else {
            throw MilaAPIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("text/plain", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "messages": [["role": "user", "content": text]],
            "context": [
                "pathname": pathname,
                "lang": language.rawValue,
                "surface": surface,
            ],
        ])

        let (bytes, response) = try await session.bytes(for: request)
        guard let http = response as? HTTPURLResponse else { throw MilaAPIError.invalidResponse }
        guard (200...299).contains(http.statusCode) else {
            var errorBody = ""
            for try await line in bytes.lines { errorBody += line }
            throw MilaAPIError.server(http.statusCode, Self.message(from: Data(errorBody.utf8)))
        }

        var reply = ""
        for try await line in bytes.lines {
            guard let separator = line.firstIndex(of: ":") else { continue }
            let type = String(line[..<separator])
            guard type == "0" || type == "3" else { continue }
            let json = String(line[line.index(after: separator)...])
            guard let data = json.data(using: .utf8),
                  let value = try? JSONDecoder().decode(String.self, from: data) else { continue }
            if type == "3" { throw MilaAPIError.server(http.statusCode, value) }
            reply += value
        }
        let trimmed = reply.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw MilaAPIError.emptyReply }
        return trimmed
    }

    func transcribe(audioURL: URL, language: AppLanguage) async throws -> TranscriptionResult {
        guard let url = URL(string: "/api/assessment/transcribe", relativeTo: Self.baseURL)?.absoluteURL else {
            throw MilaAPIError.invalidURL
        }
        let audio = try Data(contentsOf: audioURL)
        let boundary = "Mila-\(UUID().uuidString)"
        var body = Data()
        body.appendUTF8("--\(boundary)\r\n")
        body.appendUTF8("Content-Disposition: form-data; name=\"language\"\r\n\r\n")
        body.appendUTF8("\(language.rawValue)\r\n")
        body.appendUTF8("--\(boundary)\r\n")
        body.appendUTF8("Content-Disposition: form-data; name=\"audio\"; filename=\"practice.m4a\"\r\n")
        body.appendUTF8("Content-Type: audio/mp4\r\n\r\n")
        body.append(audio)
        body.appendUTF8("\r\n--\(boundary)--\r\n")

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        let (data, response) = try await session.data(for: request)
        try validate(response: response, data: data)
        return try decoder.decode(TranscriptionResult.self, from: data)
    }

    func synthesize(text: String) async throws -> Data {
        let (data, response) = try await dataRequest(
            path: "/api/tts",
            method: "POST",
            body: ["text": String(text.prefix(1_200))]
        )
        try validate(response: response, data: data)
        return data
    }

    private func jsonRequest<T: Decodable>(
        path: String,
        method: String,
        body: [String: Any]? = nil
    ) async throws -> T {
        let (data, response) = try await dataRequest(path: path, method: method, body: body)
        try validate(response: response, data: data)
        do { return try decoder.decode(T.self, from: data) }
        catch { throw MilaAPIError.invalidResponse }
    }

    private func dataRequest(
        path: String,
        method: String,
        body: [String: Any]? = nil
    ) async throws -> (Data, URLResponse) {
        guard let url = URL(string: path, relativeTo: Self.baseURL)?.absoluteURL else {
            throw MilaAPIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        return try await session.data(for: request)
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { throw MilaAPIError.invalidResponse }
        guard (200...299).contains(http.statusCode) else {
            throw MilaAPIError.server(http.statusCode, Self.message(from: data))
        }
    }

    nonisolated private static func message(from data: Data) -> String {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return "" }
        return (json["error"] as? String) ?? (json["message"] as? String) ?? ""
    }
}

private extension Data {
    mutating func appendUTF8(_ value: String) {
        if let data = value.data(using: .utf8) { append(data) }
    }
}
