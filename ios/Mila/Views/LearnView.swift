import SwiftUI

struct LearnView: View {
    @EnvironmentObject private var session: SessionStore
    @Binding var language: AppLanguage
    @Binding var webDestination: WebDestination?
    @State private var words: [MilaWord] = []
    @State private var lessons: [MilaLesson] = []
    @State private var isLoading = true
    @State private var error: String?
    @State private var revealedPhrase: UUID?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    title
                    dailyPhrases
                    if !lessons.isEmpty { lessonSection }
                    wordSection
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 28)
            }
            .background(Color.clear)
            .toolbar(.hidden, for: .navigationBar)
            .refreshable { await load() }
            .task(id: session.user?.id) { await load() }
        }
    }

    private var title: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(language == .ru ? "Учись в своём ритме" : "Learn at your pace")
                .font(.system(size: 29, weight: .black, design: .rounded))
                .foregroundStyle(Color.milaCream)
            Text(language == .ru
                ? "Фразы доступны даже без сети. FluentMitra подгрузит твои уроки и словарь, когда появится связь."
                : "Essential phrases work offline. FluentMitra loads your lessons and vocabulary when you are connected.")
                .font(.subheadline)
                .foregroundStyle(Color.milaMuted)
        }
        .padding(.top, 12)
    }

    private var dailyPhrases: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle(language == .ru ? "Карманные фразы" : "Pocket phrases", color: .milaPink)
            ForEach(OfflinePhrase.essentials) { phrase in
                Button {
                    withAnimation(.snappy) { revealedPhrase = revealedPhrase == phrase.id ? nil : phrase.id }
                } label: {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(alignment: .top) {
                            Text(phrase.english)
                                .font(.headline)
                                .foregroundStyle(Color.milaCream)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            Image(systemName: revealedPhrase == phrase.id ? "chevron.up" : "chevron.down")
                                .foregroundStyle(Color.milaMuted)
                        }
                        Text(phrase.note.uppercased())
                            .font(.system(size: 9, weight: .bold))
                            .tracking(1.2)
                            .foregroundStyle(Color.milaCyan)
                        if revealedPhrase == phrase.id {
                            Divider().overlay(Color.white.opacity(0.08))
                            Text(phrase.russian)
                                .font(.subheadline)
                                .foregroundStyle(Color.milaMuted)
                        }
                    }
                    .milaCard(padding: 16)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var lessonSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle(language == .ru ? "Твои уроки" : "Your lessons", color: .milaCyan)
            ForEach(lessons.prefix(6)) { lesson in
                NavigationLink {
                    LessonDetailView(lesson: lesson, language: language)
                } label: {
                    HStack(spacing: 14) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 13).fill(Color.milaCyan.opacity(0.11))
                            Text("\(lesson.difficulty)")
                                .font(.headline.weight(.black))
                                .foregroundStyle(Color.milaCyan)
                        }
                        .frame(width: 46, height: 46)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(lesson.title).font(.headline).foregroundStyle(Color.milaCream)
                            Text("\(lesson.learnerLevel) · \(lesson.durationMinutes) min · \(lesson.category)")
                                .font(.caption).foregroundStyle(Color.milaMuted)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(Color.milaMuted)
                    }
                    .milaCard(padding: 14)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var wordSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                sectionTitle(language == .ru ? "Словарь" : "Vocabulary", color: .milaGreen)
                Spacer()
                if isLoading { ProgressView().tint(Color.milaCyan) }
            }
            if let error {
                Text(error).font(.caption).foregroundStyle(Color.milaPink).milaCard()
            }
            if words.isEmpty && !isLoading {
                Button(language == .ru ? "Открыть полный словарь" : "Open full vocabulary") {
                    webDestination = WebDestination(title: language == .ru ? "Словарь" : "Vocabulary", path: "/vocabulary")
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.milaCyan)
                .foregroundStyle(Color.milaBlack)
            } else {
                ForEach(words.prefix(12)) { word in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(alignment: .firstTextBaseline) {
                            Text(word.english)
                                .font(.title3.weight(.bold))
                                .foregroundStyle(Color.milaCream)
                            Text(word.phonetic)
                                .font(.subheadline.monospaced())
                                .foregroundStyle(Color.milaCyan)
                            Spacer()
                            Text(word.partOfSpeech.uppercased())
                                .font(.system(size: 8, weight: .black))
                                .foregroundStyle(Color.milaMuted)
                        }
                        Text(word.translationNative)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Color.milaPink)
                        if let example = word.exampleSentence, !example.isEmpty {
                            Text(example).font(.caption).foregroundStyle(Color.milaMuted)
                        }
                    }
                    .milaCard(padding: 15)
                }
            }
        }
    }

    private func sectionTitle(_ text: String, color: Color) -> some View {
        Text(text.uppercased())
            .font(.caption.weight(.black))
            .tracking(1.4)
            .foregroundStyle(color)
    }

    private func load() async {
        guard session.user != nil else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            async let remoteWords = MilaAPI.shared.words()
            async let remoteLessons = MilaAPI.shared.lessons()
            words = try await remoteWords
            lessons = try await remoteLessons
            error = nil
        } catch {
            self.error = language == .ru
                ? "Не удалось обновить личный словарь. Сохранённые фразы всё ещё доступны."
                : "Your personal vocabulary could not refresh. Saved phrases are still available."
        }
    }
}

private struct LessonDetailView: View {
    let lesson: MilaLesson
    let language: AppLanguage

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text(lesson.category.uppercased())
                    .font(.caption.weight(.black)).tracking(1.4).foregroundStyle(Color.milaCyan)
                Text(lesson.title)
                    .font(.system(size: 30, weight: .black, design: .rounded))
                    .foregroundStyle(Color.milaCream)
                Label("\(lesson.learnerLevel) · \(lesson.durationMinutes) min", systemImage: "clock.fill")
                    .font(.subheadline).foregroundStyle(Color.milaMuted)
                Text(lesson.content)
                    .font(.body)
                    .foregroundStyle(Color.milaCream.opacity(0.9))
                    .lineSpacing(6)
                    .textSelection(.enabled)
            }
            .padding(20)
        }
        .background(MilaBackground())
        .navigationTitle(language == .ru ? "Урок" : "Lesson")
        .navigationBarTitleDisplayMode(.inline)
    }
}
