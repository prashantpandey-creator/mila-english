import SwiftUI
import UIKit

enum RootTab: Hashable {
    case home
    case learn
    case speak
    case chat
    case progress
}

struct WebDestination: Identifiable {
    let id = UUID()
    let title: String
    let path: String
}

struct RootView: View {
    @EnvironmentObject private var session: SessionStore
    @EnvironmentObject private var network: NetworkMonitor
    @AppStorage("mila_language") private var languageRaw = AppLanguage.ru.rawValue
    @State private var tab: RootTab = .home
    @State private var settingsPresented = false
    @State private var webDestination: WebDestination?

    private var language: Binding<AppLanguage> {
        Binding(
            get: { AppLanguage(rawValue: languageRaw) ?? .ru },
            set: { languageRaw = $0.rawValue }
        )
    }

    init() {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(Color.milaBlack)
        appearance.shadowColor = UIColor.white.withAlphaComponent(0.08)
        let normal = UIColor(Color.milaMuted)
        let selected = UIColor(Color.milaCyan)
        for style in [appearance.stackedLayoutAppearance, appearance.inlineLayoutAppearance, appearance.compactInlineLayoutAppearance] {
            style.normal.iconColor = normal
            style.normal.titleTextAttributes = [.foregroundColor: normal]
            style.selected.iconColor = selected
            style.selected.titleTextAttributes = [.foregroundColor: selected]
        }
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }

    var body: some View {
        ZStack {
            MilaBackground()
            TabView(selection: $tab) {
                HomeView(
                    language: language,
                    selectedTab: $tab,
                    settingsPresented: $settingsPresented,
                    webDestination: $webDestination
                )
                .tag(RootTab.home)
                .tabItem { Label(language.wrappedValue == .ru ? "Главная" : "Home", systemImage: "house.fill") }

                LearnView(language: language, webDestination: $webDestination)
                    .tag(RootTab.learn)
                    .tabItem { Label(language.wrappedValue == .ru ? "Учиться" : "Learn", systemImage: "rectangle.stack.fill") }

                SpeakView(language: language)
                    .tag(RootTab.speak)
                    .tabItem { Label(language.wrappedValue == .ru ? "Говорить" : "Speak", systemImage: "waveform.circle.fill") }

                ChatView(language: language)
                    .tag(RootTab.chat)
                    .tabItem { Label(language.wrappedValue == .ru ? "Преподаватель" : "Teacher", systemImage: "bubble.left.and.bubble.right.fill") }

                LearnerProgressView(language: language, webDestination: $webDestination)
                    .tag(RootTab.progress)
                    .tabItem { Label(language.wrappedValue == .ru ? "Прогресс" : "Progress", systemImage: "chart.line.uptrend.xyaxis") }
            }
            .tint(Color.milaCyan)
        }
        .safeAreaInset(edge: .top, spacing: 0) {
            if !network.isConnected {
                Label(
                    language.wrappedValue == .ru ? "Офлайн — сохранённые фразы доступны" : "Offline — saved phrases are available",
                    systemImage: "wifi.slash"
                )
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color.milaBlack)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 7)
                .background(Color.milaPink)
            }
        }
        .sheet(isPresented: $settingsPresented) {
            SettingsView(language: language)
                .environmentObject(session)
        }
        .sheet(item: $webDestination) { destination in
            WebModuleView(destination: destination)
                .ignoresSafeArea()
        }
        .overlay(alignment: .top) {
            if case .failed(let message) = session.phase {
                HStack(spacing: 10) {
                    Image(systemName: "exclamationmark.triangle.fill")
                    Text(message).lineLimit(2)
                    Spacer()
                    Button(language.wrappedValue == .ru ? "Повторить" : "Retry") {
                        Task { await session.bootstrap() }
                    }
                    .fontWeight(.bold)
                }
                .font(.caption)
                .padding(12)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
                .padding(.horizontal, 14)
                .padding(.top, 6)
            }
        }
        .onOpenURL { url in
            guard url.scheme == "mila" else { return }
            switch url.host?.lowercased() {
            case "home": tab = .home
            case "learn": tab = .learn
            case "speak": tab = .speak
            case "chat": tab = .chat
            case "progress": tab = .progress
            default: break
            }
        }
    }
}
