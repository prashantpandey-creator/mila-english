import Foundation

@MainActor
final class SessionStore: ObservableObject {
    enum Phase: Equatable {
        case loading
        case ready
        case failed(String)
    }

    @Published private(set) var phase: Phase = .loading
    @Published private(set) var user: UserProfile?

    var isGuest: Bool { user?.email.hasPrefix("guest-") == true }

    func bootstrap() async {
        phase = .loading
        do {
            do {
                user = try await MilaAPI.shared.currentUser()
            } catch MilaAPIError.server(let code, _) where code == 401 {
                user = try await MilaAPI.shared.createGuest()
            }
            phase = .ready
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    func signIn(email: String, password: String) async throws {
        user = try await MilaAPI.shared.login(email: email, password: password)
        phase = .ready
    }

    func register(name: String, email: String, password: String) async throws {
        user = try await MilaAPI.shared.register(name: name, email: email, password: password)
        phase = .ready
    }

    func signOut() async throws {
        try await MilaAPI.shared.logout()
        user = try await MilaAPI.shared.createGuest()
        phase = .ready
    }

    func deleteAccount() async throws {
        try await MilaAPI.shared.deleteAccount()
        user = try await MilaAPI.shared.createGuest()
        phase = .ready
    }
}
