import Foundation

enum AppLanguage: String, CaseIterable, Identifiable, Sendable {
    case ru
    case en

    var id: String { rawValue }
    var label: String { self == .ru ? "RU" : "EN" }
    var localeName: String { self == .ru ? "Русский" : "English" }
}

struct UserProfile: Codable, Identifiable, Sendable {
    let id: Int
    let name: String
    let email: String
    let learnerCategory: String?
    let nativeLanguage: String?
    let level: String?
    let streakDays: Int?
}

struct ProgressSummary: Codable, Sendable {
    let completedLessons: Int
    let totalTimeSeconds: Int
    let avgScore: Int
    let recentLessons: [RecentLesson]
    let weakPhonemes: [WeakPhoneme]
}

struct RecentLesson: Codable, Identifiable, Sendable {
    let lessonTitle: String?
    let category: String?
    let score: Int?
    let completed: Bool
    let date: String?

    var id: String { "\(lessonTitle ?? "lesson")-\(date ?? UUID().uuidString)" }
}

struct WeakPhoneme: Codable, Identifiable, Sendable {
    let phoneme: String
    let mastery: Double
    let attempts: Int
    let lastAcc: Int?

    var id: String { phoneme }
}

struct MilaWord: Codable, Identifiable, Sendable {
    let id: Int
    let english: String
    let phonetic: String
    let translationNative: String
    let partOfSpeech: String
    let exampleSentence: String?
    let difficultyLevel: Int
}

struct MilaLesson: Codable, Identifiable, Sendable {
    let id: Int
    let title: String
    let category: String
    let learnerLevel: String
    let durationMinutes: Int
    let content: String
    let difficulty: Int
}

struct ChatMessage: Identifiable, Sendable {
    enum Role: String, Sendable { case user, assistant }
    let id: UUID
    let role: Role
    var text: String

    init(id: UUID = UUID(), role: Role, text: String) {
        self.id = id
        self.role = role
        self.text = text
    }
}

struct TranscriptionResult: Codable, Sendable {
    let text: String
    let durationSeconds: Double?
    let avgLogprob: Double?
    let noSpeechProbability: Double?
    let language: String?
}

struct OfflinePhrase: Identifiable, Sendable {
    let id = UUID()
    let english: String
    let russian: String
    let note: String

    static let essentials: [OfflinePhrase] = [
        .init(english: "Could you say that again, please?", russian: "Повторите, пожалуйста.", note: "Polite clarification"),
        .init(english: "I’d like to practise speaking.", russian: "Я хочу попрактиковаться в разговоре.", note: "Learning goal"),
        .init(english: "What does this word mean?", russian: "Что означает это слово?", note: "Vocabulary"),
        .init(english: "Let me try one more time.", russian: "Дайте мне попробовать ещё раз.", note: "Confidence phrase"),
        .init(english: "I understand, but I need a moment.", russian: "Я понимаю, но мне нужна минутка.", note: "Natural conversation"),
    ]
}
