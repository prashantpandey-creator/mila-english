import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var session: SessionStore
    @Environment(\.dismiss) private var dismiss
    @Binding var language: AppLanguage
    @State private var accountMode: AccountMode = .signIn
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var busy = false
    @State private var error: String?
    @State private var resetMessage: String?
    @State private var confirmDelete = false
    @State private var webDestination: WebDestination?

    private enum AccountMode: String, CaseIterable, Identifiable {
        case signIn
        case register
        var id: String { rawValue }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    languageSection
                    accountSection
                    privacySection
                    aboutSection
                }
                .padding(18)
            }
            .background(MilaBackground())
            .navigationTitle(language == .ru ? "Аккаунт" : "Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(language == .ru ? "Готово" : "Done") { dismiss() }
                        .foregroundStyle(Color.milaCyan)
                }
            }
        }
        .sheet(item: $webDestination) { WebModuleView(destination: $0).ignoresSafeArea() }
        .alert(language == .ru ? "Удалить аккаунт?" : "Delete account?", isPresented: $confirmDelete) {
            Button(language == .ru ? "Отмена" : "Cancel", role: .cancel) {}
            Button(language == .ru ? "Удалить навсегда" : "Delete permanently", role: .destructive) {
                Task { await deleteAccount() }
            }
        } message: {
            Text(language == .ru
                ? "FluentMitra удалит профиль, прогресс, историю чата и сохранённые воспоминания. Это действие нельзя отменить."
                : "FluentMitra will delete your profile, progress, chat history, and saved memories. This cannot be undone.")
        }
    }

    private var languageSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionLabel(language == .ru ? "ЯЗЫК" : "LANGUAGE")
            Picker("Language", selection: $language) {
                Text("Русский").tag(AppLanguage.ru)
                Text("English").tag(AppLanguage.en)
            }
            .pickerStyle(.segmented)
        }
        .milaCard()
    }

    @ViewBuilder
    private var accountSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionLabel(language == .ru ? "ПРОФИЛЬ" : "PROFILE")
            if let user = session.user, !session.isGuest {
                HStack(spacing: 13) {
                    Image(systemName: "person.crop.circle.fill")
                        .font(.system(size: 42)).foregroundStyle(Color.milaCyan)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(user.name).font(.headline).foregroundStyle(Color.milaCream)
                        Text(user.email).font(.caption).foregroundStyle(Color.milaMuted)
                        if let level = user.level, level != "pending" {
                            Text(level).font(.caption.weight(.bold)).foregroundStyle(Color.milaPink)
                        }
                    }
                }
                Divider().overlay(Color.white.opacity(0.08))
                Button(language == .ru ? "Выйти" : "Sign out") {
                    Task { await signOut() }
                }
                .foregroundStyle(Color.milaCyan)
                Button(language == .ru ? "Удалить аккаунт и данные" : "Delete account and data", role: .destructive) {
                    confirmDelete = true
                }
                .foregroundStyle(Color.milaPink)
            } else {
                Text(language == .ru
                    ? "Сейчас ты учишься как приватный гость. Создай аккаунт, чтобы перенести прогресс между устройствами."
                    : "You are learning as a private guest. Create an account to carry progress between devices.")
                    .font(.subheadline).foregroundStyle(Color.milaMuted)
                Picker("Account mode", selection: $accountMode) {
                    Text(language == .ru ? "Войти" : "Sign in").tag(AccountMode.signIn)
                    Text(language == .ru ? "Создать" : "Create").tag(AccountMode.register)
                }
                .pickerStyle(.segmented)
                if accountMode == .register {
                    TextField(language == .ru ? "Имя" : "Name", text: $name)
                        .textContentType(.name)
                        .milaField()
                }
                TextField("Email", text: $email)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .textContentType(.emailAddress)
                    .milaField()
                SecureField(language == .ru ? "Пароль" : "Password", text: $password)
                    .textContentType(accountMode == .register ? .newPassword : .password)
                    .milaField()
                if accountMode == .signIn {
                    Button(language == .ru ? "Забыли пароль? Отправить ссылку" : "Forgot password? Send a reset link") {
                        Task { await requestPasswordReset() }
                    }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color.milaCyan)
                    .disabled(busy || email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    if let resetMessage { Text(resetMessage).font(.caption).foregroundStyle(Color.milaGreen) }
                }
                if let error { Text(error).font(.caption).foregroundStyle(Color.milaPink) }
                Button {
                    Task { await submitAccount() }
                } label: {
                    HStack {
                        if busy { ProgressView().tint(Color.milaBlack) }
                        Text(accountMode == .signIn
                            ? (language == .ru ? "Войти" : "Sign in")
                            : (language == .ru ? "Создать аккаунт" : "Create account"))
                            .fontWeight(.bold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .foregroundStyle(Color.milaBlack)
                    .background(Color.milaCyan, in: RoundedRectangle(cornerRadius: 14))
                }
                .disabled(busy || email.isEmpty || password.count < 8 || (accountMode == .register && name.isEmpty))
                Divider().overlay(Color.white.opacity(0.08))
                Button(language == .ru ? "Удалить гостевые данные" : "Delete guest data", role: .destructive) {
                    confirmDelete = true
                }
                .font(.subheadline)
                .foregroundStyle(Color.milaPink)
            }
        }
        .milaCard()
    }

    private var privacySection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionLabel(language == .ru ? "ПРИВАТНОСТЬ И ПОМОЩЬ" : "PRIVACY & HELP")
            settingsRow(
                title: language == .ru ? "Политика конфиденциальности" : "Privacy policy",
                icon: "hand.raised.fill"
            ) { webDestination = .init(title: language == .ru ? "Конфиденциальность" : "Privacy", path: "/privacy") }
            settingsRow(
                title: language == .ru ? "Условия использования" : "Terms of service",
                icon: "doc.text.fill"
            ) { webDestination = .init(title: language == .ru ? "Условия" : "Terms", path: "/terms") }
            settingsRow(
                title: language == .ru ? "Сообщить об ошибке" : "Report a problem",
                icon: "exclamationmark.bubble.fill"
            ) { webDestination = .init(title: language == .ru ? "Поддержка" : "Support", path: "/support") }
        }
        .milaCard()
    }

    private var aboutSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            sectionLabel(language == .ru ? "О ПРИЛОЖЕНИИ" : "ABOUT")
            Text("FluentMitra 1.0 (1)").font(.subheadline.weight(.bold)).foregroundStyle(Color.milaCream)
            Text(language == .ru
                ? "Персональная студия английского для русскоязычных учеников."
                : "A personal English studio for Russian-speaking learners.")
                .font(.caption).foregroundStyle(Color.milaMuted)
        }
        .milaCard()
    }

    private func sectionLabel(_ text: String) -> some View {
        Text(text).font(.caption.weight(.black)).tracking(1.3).foregroundStyle(Color.milaCyan)
    }

    private func settingsRow(title: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon).foregroundStyle(Color.milaPink).frame(width: 24)
                Text(title).foregroundStyle(Color.milaCream)
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(Color.milaMuted)
            }
        }
        .buttonStyle(.plain)
    }

    private func submitAccount() async {
        busy = true
        resetMessage = nil
        defer { busy = false }
        do {
            if accountMode == .signIn {
                try await session.signIn(email: email, password: password)
            } else {
                try await session.register(name: name, email: email, password: password)
            }
            password = ""
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func requestPasswordReset() async {
        busy = true
        error = nil
        resetMessage = nil
        defer { busy = false }
        do {
            try await MilaAPI.shared.requestPasswordReset(email: email)
            resetMessage = language == .ru
                ? "Если такой аккаунт существует, FluentMitra отправил приватную ссылку на 30 минут."
                : "If that account exists, FluentMitra sent a private 30-minute reset link."
        } catch {
            self.error = language == .ru
                ? "Не удалось запросить ссылку. Проверь соединение и попробуй ещё раз."
                : "Could not request a reset link. Check your connection and try again."
        }
    }

    private func signOut() async {
        busy = true
        defer { busy = false }
        do { try await session.signOut() }
        catch { self.error = error.localizedDescription }
    }

    private func deleteAccount() async {
        busy = true
        defer { busy = false }
        do { try await session.deleteAccount() }
        catch { self.error = error.localizedDescription }
    }
}

private extension View {
    func milaField() -> some View {
        self
            .padding(.horizontal, 13)
            .padding(.vertical, 11)
            .foregroundStyle(Color.milaCream)
            .background(Color.milaPanelRaised, in: RoundedRectangle(cornerRadius: 13))
            .overlay(RoundedRectangle(cornerRadius: 13).stroke(Color.white.opacity(0.08)))
    }
}
