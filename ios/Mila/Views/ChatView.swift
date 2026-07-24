import SwiftUI

struct ChatView: View {
    @EnvironmentObject private var session: SessionStore
    @EnvironmentObject private var network: NetworkMonitor
    @Binding var language: AppLanguage
    @State private var messages: [ChatMessage] = []
    @State private var input = ""
    @State private var sending = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                header
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            if messages.isEmpty { welcome }
                            ForEach(messages) { message in
                                messageBubble(message)
                                    .id(message.id)
                            }
                            if sending {
                                HStack {
                                    ProgressView().tint(Color.milaCyan)
                                    Text(language == .ru ? "Преподаватель печатает…" : "Your teacher is typing…")
                                        .font(.caption).foregroundStyle(Color.milaMuted)
                                    Spacer()
                                }
                                .milaCard(padding: 13)
                            }
                        }
                        .padding(16)
                    }
                    .onChange(of: messages.count) { _ in
                        if let last = messages.last?.id { withAnimation { proxy.scrollTo(last, anchor: .bottom) } }
                    }
                }
                composer
            }
            .background(Color.clear)
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var header: some View {
        HStack {
            MilaWordmark()
            Spacer()
            Button {
                withAnimation { messages.removeAll(); error = nil }
            } label: {
                Image(systemName: "square.and.pencil")
                    .foregroundStyle(Color.milaCyan)
                    .frame(width: 40, height: 40)
                    .background(Color.white.opacity(0.06), in: Circle())
            }
            .accessibilityLabel(language == .ru ? "Новый разговор" : "New conversation")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color.milaBlack.opacity(0.92))
    }

    private var welcome: some View {
        VStack(spacing: 14) {
            MilaMark(size: 72)
            Text(language == .ru ? "Твой преподаватель FluentMitra готов" : "Your FluentMitra teacher is ready")
                .font(.title2.weight(.black)).foregroundStyle(Color.milaCream)
            Text(language == .ru
                ? "Спроси об английском, разыграй ситуацию или просто поговори. Я мягко исправлю только важную ошибку."
                : "Ask about English, role-play a situation, or simply talk. I’ll gently correct only the most useful mistake.")
                .font(.subheadline).multilineTextAlignment(.center).foregroundStyle(Color.milaMuted)
            VStack(spacing: 8) {
                starter(language == .ru ? "Давай потренируем разговор в кафе" : "Let’s practise ordering at a café")
                starter(language == .ru ? "Объясни Present Perfect просто" : "Explain the present perfect simply")
                starter(language == .ru ? "Проведи мини-собеседование" : "Give me a short job interview")
            }
        }
        .padding(.vertical, 28)
    }

    private func starter(_ text: String) -> some View {
        Button(text) {
            input = text
            Task { await send() }
        }
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(Color.milaCyan)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.milaCyan.opacity(0.08), in: Capsule())
        .buttonStyle(.plain)
    }

    private func messageBubble(_ message: ChatMessage) -> some View {
        HStack {
            if message.role == .user { Spacer(minLength: 48) }
            Text(rendered(message.text))
                .font(.body)
                .foregroundStyle(message.role == .user ? Color.milaBlack : Color.milaCream)
                .padding(.horizontal, 15)
                .padding(.vertical, 12)
                .background(
                    message.role == .user ? Color.milaCyan : Color.milaPanel,
                    in: RoundedRectangle(cornerRadius: 18, style: .continuous)
                )
                .textSelection(.enabled)
                .accessibilityIdentifier("chat.message.\(message.role.rawValue)")
            if message.role == .assistant { Spacer(minLength: 48) }
        }
    }

    private func rendered(_ value: String) -> AttributedString {
        (try? AttributedString(
            markdown: value,
            options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        )) ?? AttributedString(value)
    }

    private var composer: some View {
        VStack(spacing: 7) {
            if let error {
                Text(error).font(.caption).foregroundStyle(Color.milaPink).frame(maxWidth: .infinity, alignment: .leading)
            }
            HStack(spacing: 10) {
                TextField(language == .ru ? "Напиши преподавателю…" : "Message your teacher…", text: $input, axis: .vertical)
                    .lineLimit(1...4)
                    .textFieldStyle(.plain)
                    .foregroundStyle(Color.milaCream)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                    .background(Color.milaPanelRaised, in: RoundedRectangle(cornerRadius: 18))
                    .onSubmit { Task { await send() } }
                Button {
                    Task { await send() }
                } label: {
                    Image(systemName: "arrow.up")
                        .font(.headline.weight(.black))
                        .foregroundStyle(Color.milaBlack)
                        .frame(width: 44, height: 44)
                        .background(Color.milaCyan, in: Circle())
                }
                .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || sending || !network.isConnected)
                .accessibilityLabel(language == .ru ? "Отправить" : "Send")
            }
        }
        .padding(.horizontal, 14)
        .padding(.top, 10)
        .padding(.bottom, 5)
        .background(.ultraThinMaterial)
    }

    private func send() async {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !sending else { return }
        input = ""
        error = nil
        messages.append(.init(role: .user, text: text))
        sending = true
        defer { sending = false }
        do {
            if session.user == nil { await session.bootstrap() }
            let reply = try await MilaAPI.shared.sendChat(text: text, language: language)
            messages.append(.init(role: .assistant, text: reply))
        } catch MilaAPIError.server(let code, _) where code == 401 {
            await session.bootstrap()
            do {
                let reply = try await MilaAPI.shared.sendChat(text: text, language: language)
                messages.append(.init(role: .assistant, text: reply))
            } catch {
                self.error = error.localizedDescription
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
