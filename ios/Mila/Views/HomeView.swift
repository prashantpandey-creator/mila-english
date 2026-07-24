import SwiftUI

struct HomeView: View {
    @Binding var language: AppLanguage
    @Binding var selectedTab: RootTab
    @Binding var settingsPresented: Bool
    @Binding var webDestination: WebDestination?

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    header
                    hero
                    nativeActions
                    deepPractice
                    privacyNote
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 28)
            }
            .scrollIndicators(.hidden)
            .background(Color.clear)
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var header: some View {
        HStack {
            MilaWordmark()
            Spacer()
            Picker("Language", selection: $language) {
                ForEach(AppLanguage.allCases) { item in Text(item.label).tag(item) }
            }
            .pickerStyle(.segmented)
            .frame(width: 100)
            Button { settingsPresented = true } label: {
                Image(systemName: "person.crop.circle")
                    .font(.title2)
                    .foregroundStyle(Color.milaCream)
                    .frame(width: 42, height: 42)
                    .background(Color.white.opacity(0.06), in: Circle())
            }
            .accessibilityLabel(language == .ru ? "Аккаунт и настройки" : "Account and settings")
        }
        .padding(.top, 10)
    }

    private var hero: some View {
        HStack(alignment: .center, spacing: 14) {
            VStack(alignment: .leading, spacing: 9) {
                Text(language == .ru ? "Говори смелее." : "Speak with confidence.")
                    .font(.system(size: 32, weight: .black, design: .rounded))
                    .foregroundStyle(Color.milaCream)
                Text(language == .ru
                    ? "Личный английский-тренер с голосом, памятью и мягкой обратной связью."
                    : "A personal English coach with voice, memory, and gentle feedback.")
                    .font(.subheadline)
                    .foregroundStyle(Color.milaMuted)
                    .fixedSize(horizontal: false, vertical: true)
                Button {
                    selectedTab = .speak
                } label: {
                    Label(language == .ru ? "Начать разговор" : "Start speaking", systemImage: "mic.fill")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Color.milaBlack)
                        .padding(.horizontal, 15)
                        .padding(.vertical, 11)
                        .background(Color.milaCyan, in: Capsule())
                }
                .padding(.top, 2)
            }
            Spacer(minLength: 0)
            MilaMark(size: 104)
                .shadow(color: Color.milaCyan.opacity(0.28), radius: 24)
        }
        .milaCard(padding: 20)
    }

    private var nativeActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle(language == .ru ? "Твоя студия" : "Your studio")
            LazyVGrid(columns: columns, spacing: 12) {
                actionCard(
                    title: language == .ru ? "Слова" : "Words",
                    subtitle: language == .ru ? "Карточки и примеры" : "Cards and examples",
                    icon: "text.book.closed.fill",
                    color: .milaPink
                ) { selectedTab = .learn }
                actionCard(
                    title: language == .ru ? "Голос" : "Voice",
                    subtitle: language == .ru ? "Скажи — преподаватель ответит" : "Speak — your teacher replies",
                    icon: "waveform",
                    color: .milaCyan
                ) { selectedTab = .speak }
                actionCard(
                    title: language == .ru ? "Чат" : "Chat",
                    subtitle: language == .ru ? "Вопросы и практика" : "Questions and practice",
                    icon: "sparkles",
                    color: .milaGreen
                ) { selectedTab = .chat }
                actionCard(
                    title: language == .ru ? "Прогресс" : "Progress",
                    subtitle: language == .ru ? "Уроки и произношение" : "Lessons and pronunciation",
                    icon: "chart.bar.fill",
                    color: .milaCream
                ) { selectedTab = .progress }
            }
        }
    }

    private var deepPractice: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle(language == .ru ? "Полная практика" : "Full practice")
            VStack(spacing: 1) {
                moduleRow(
                    title: language == .ru ? "Проверка уровня" : "Level check",
                    subtitle: language == .ru ? "Голосовой CEFR-маршрут" : "Voice-based CEFR path",
                    icon: "gauge.with.dots.needle.50percent",
                    path: "/assessment"
                )
                moduleRow(
                    title: language == .ru ? "Аудирование" : "Listening",
                    subtitle: language == .ru ? "Слушай и отвечай" : "Listen and respond",
                    icon: "headphones",
                    path: "/listen"
                )
                moduleRow(
                    title: language == .ru ? "Грамматика" : "Grammar",
                    subtitle: language == .ru ? "Коротко, понятно, в контексте" : "Short, clear, in context",
                    icon: "character.book.closed.fill",
                    path: "/grammar"
                )
            }
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        }
    }

    private var privacyNote: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "lock.shield.fill").foregroundStyle(Color.milaGreen)
            Text(language == .ru
                ? "Голос обрабатывается частными сервисами FluentMitra и удаляется после запроса. Без рекламы и трекинга."
                : "Voice is processed by FluentMitra’s private services and deleted after the request. No ads or tracking.")
                .font(.caption)
                .foregroundStyle(Color.milaMuted)
        }
        .padding(.horizontal, 3)
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.caption.weight(.black))
            .tracking(1.5)
            .foregroundStyle(Color.milaMuted)
    }

    private func actionCard(
        title: String,
        subtitle: String,
        icon: String,
        color: Color,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                Image(systemName: icon)
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(color)
                Text(title)
                    .font(.headline)
                    .foregroundStyle(Color.milaCream)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(Color.milaMuted)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(maxWidth: .infinity, minHeight: 118, alignment: .topLeading)
            .milaCard(padding: 16)
        }
        .buttonStyle(.plain)
    }

    private func moduleRow(title: String, subtitle: String, icon: String, path: String) -> some View {
        Button {
            webDestination = WebDestination(title: title, path: path)
        } label: {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(Color.milaCyan)
                    .frame(width: 32)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(.subheadline.weight(.bold)).foregroundStyle(Color.milaCream)
                    Text(subtitle).font(.caption).foregroundStyle(Color.milaMuted)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(Color.milaMuted)
            }
            .padding(16)
            .background(Color.milaPanel)
        }
        .buttonStyle(.plain)
    }
}
