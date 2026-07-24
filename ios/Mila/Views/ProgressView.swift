import SwiftUI

struct LearnerProgressView: View {
    @EnvironmentObject private var session: SessionStore
    @Binding var language: AppLanguage
    @Binding var webDestination: WebDestination?
    @State private var summary: ProgressSummary?
    @State private var loading = true
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    heading
                    stats
                    pronunciation
                    recent
                    levelCheck
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 30)
            }
            .background(Color.clear)
            .toolbar(.hidden, for: .navigationBar)
            .refreshable { await load() }
            .task(id: session.user?.id) { await load() }
        }
    }

    private var heading: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(language == .ru ? "Твой прогресс" : "Your progress")
                    .font(.system(size: 29, weight: .black, design: .rounded))
                    .foregroundStyle(Color.milaCream)
                Spacer()
                if loading { ProgressView().tint(Color.milaCyan) }
            }
            Text(language == .ru ? "Только реальные завершённые уроки и попытки." : "Only real completed lessons and attempts.")
                .font(.subheadline).foregroundStyle(Color.milaMuted)
            if let error { Text(error).font(.caption).foregroundStyle(Color.milaPink) }
        }
        .padding(.top, 14)
    }

    private var stats: some View {
        HStack(spacing: 10) {
            stat(value: "\(summary?.completedLessons ?? 0)", label: language == .ru ? "уроков" : "lessons", color: .milaCyan)
            stat(value: minutes, label: language == .ru ? "минут" : "minutes", color: .milaPink)
            stat(value: "\(summary?.avgScore ?? 0)%", label: language == .ru ? "среднее" : "average", color: .milaGreen)
        }
    }

    private var pronunciation: some View {
        VStack(alignment: .leading, spacing: 13) {
            Text(language == .ru ? "ЗВУКИ ДЛЯ ФОКУСА" : "SOUNDS TO FOCUS ON")
                .font(.caption.weight(.black)).tracking(1.4).foregroundStyle(Color.milaCyan)
            if let items = summary?.weakPhonemes, !items.isEmpty {
                ForEach(items) { item in
                    HStack(spacing: 13) {
                        Text(item.phoneme)
                            .font(.title2.monospaced().weight(.bold))
                            .foregroundStyle(Color.milaCream)
                            .frame(width: 46, height: 46)
                            .background(Color.milaPink.opacity(0.12), in: RoundedRectangle(cornerRadius: 13))
                        VStack(alignment: .leading, spacing: 5) {
                            ProgressView(value: item.mastery)
                                .tint(Color.milaPink)
                            Text("\(Int(item.mastery * 100))% · \(item.attempts) \(language == .ru ? "попыток" : "attempts")")
                                .font(.caption).foregroundStyle(Color.milaMuted)
                        }
                    }
                }
            } else {
                Text(language == .ru
                    ? "Пройди голосовую проверку, чтобы FluentMitra нашёл звуки для практики."
                    : "Complete a voice check so FluentMitra can find the sounds worth practising.")
                    .font(.subheadline).foregroundStyle(Color.milaMuted)
            }
        }
        .milaCard()
    }

    @ViewBuilder
    private var recent: some View {
        if let lessons = summary?.recentLessons, !lessons.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Text(language == .ru ? "НЕДАВНО" : "RECENT")
                    .font(.caption.weight(.black)).tracking(1.4).foregroundStyle(Color.milaPink)
                ForEach(lessons) { lesson in
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(lesson.lessonTitle ?? (language == .ru ? "Урок" : "Lesson"))
                                .font(.subheadline.weight(.bold)).foregroundStyle(Color.milaCream)
                            Text(lesson.category ?? "").font(.caption).foregroundStyle(Color.milaMuted)
                        }
                        Spacer()
                        if let score = lesson.score {
                            Text("\(score)%").font(.headline).foregroundStyle(Color.milaGreen)
                        }
                    }
                    .milaCard(padding: 14)
                }
            }
        }
    }

    private var levelCheck: some View {
        Button {
            webDestination = WebDestination(
                title: language == .ru ? "Проверка уровня" : "Level check",
                path: "/assessment"
            )
        } label: {
            HStack {
                Image(systemName: "waveform.badge.magnifyingglass").font(.title2)
                VStack(alignment: .leading) {
                    Text(language == .ru ? "Обновить уровень" : "Refresh your level").font(.headline)
                    Text(language == .ru ? "Полная голосовая проверка CEFR" : "Full voice-based CEFR check").font(.caption)
                }
                Spacer()
                Image(systemName: "arrow.up.right")
            }
            .foregroundStyle(Color.milaBlack)
            .padding(17)
            .background(Color.milaCyan, in: RoundedRectangle(cornerRadius: 20))
        }
        .buttonStyle(.plain)
    }

    private func stat(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 5) {
            Text(value).font(.title2.weight(.black)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(Color.milaMuted)
        }
        .frame(maxWidth: .infinity)
        .milaCard(padding: 13)
    }

    private var minutes: String {
        String((summary?.totalTimeSeconds ?? 0) / 60)
    }

    private func load() async {
        guard session.user != nil else { return }
        loading = true
        defer { loading = false }
        do {
            summary = try await MilaAPI.shared.progress()
            error = nil
        } catch {
            self.error = language == .ru ? "Прогресс сейчас недоступен." : "Progress is unavailable right now."
        }
    }
}
