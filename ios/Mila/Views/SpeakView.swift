import SwiftUI

struct SpeakView: View {
    @EnvironmentObject private var session: SessionStore
    @EnvironmentObject private var network: NetworkMonitor
    @Binding var language: AppLanguage
    @StateObject private var voice = VoicePracticeModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    heading
                    microphone
                    transcript
                    privacy
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 30)
            }
            .background(Color.clear)
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var heading: some View {
        VStack(spacing: 9) {
            MilaMark(size: 86)
                .shadow(color: Color.milaCyan.opacity(0.25), radius: 28)
            Text(language == .ru ? "Практика во FluentMitra" : "Practise with FluentMitra")
                .font(.system(size: 29, weight: .black, design: .rounded))
                .foregroundStyle(Color.milaCream)
            Text(language == .ru
                ? "Нажми, скажи одну мысль и нажми снова. Твой преподаватель расшифрует речь, мягко ответит и прочитает ответ вслух."
                : "Tap, say one thought, then tap again. Your teacher transcribes it, responds gently, and reads the reply aloud.")
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundStyle(Color.milaMuted)
        }
        .padding(.top, 16)
    }

    private var microphone: some View {
        VStack(spacing: 16) {
            ZStack {
                if voice.state == .recording {
                    Circle()
                        .stroke(Color.milaPink.opacity(0.35), lineWidth: 2)
                        .frame(width: 154, height: 154)
                        .scaleEffect(1.15)
                        .opacity(0.2)
                }
                Button {
                    Task { await voice.toggle(language: language) }
                } label: {
                    Image(systemName: microphoneIcon)
                        .font(.system(size: 42, weight: .bold))
                        .foregroundStyle(Color.milaBlack)
                        .frame(width: 126, height: 126)
                        .background(microphoneColor, in: Circle())
                        .shadow(color: microphoneColor.opacity(0.32), radius: 24)
                }
                .disabled(voice.isBusy || session.user == nil || !network.isConnected)
                .accessibilityLabel(microphoneLabel)
            }
            HStack(spacing: 9) {
                if voice.isBusy { ProgressView().tint(Color.milaCyan) }
                Text(statusText)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(statusColor)
            }
            Picker("Language", selection: $language) {
                ForEach(AppLanguage.allCases) { item in Text(item.localeName).tag(item) }
            }
            .pickerStyle(.segmented)
            .frame(maxWidth: 260)
        }
        .frame(maxWidth: .infinity)
        .milaCard(padding: 24)
    }

    @ViewBuilder
    private var transcript: some View {
        if !voice.transcript.isEmpty || !voice.reply.isEmpty {
            VStack(alignment: .leading, spacing: 14) {
                if !voice.transcript.isEmpty {
                    bubble(
                        label: language == .ru ? "Ты сказала / сказал" : "You said",
                        text: voice.transcript,
                        color: .milaPink
                    )
                }
                if !voice.reply.isEmpty {
                    bubble(
                        label: language == .ru ? "Преподаватель" : "Your teacher",
                        text: voice.reply,
                        color: .milaCyan,
                        replay: { Task { await voice.replay() } }
                    )
                }
            }
        }
    }

    private var privacy: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "lock.fill").foregroundStyle(Color.milaGreen)
            Text(language == .ru
                ? "Запись отправляется только во FluentMitra, расшифровывается частной моделью и удаляется сразу после запроса. Текст сохраняется в твоей истории обучения."
                : "The recording goes only to FluentMitra, is transcribed by a private model, and is deleted immediately after the request. The transcript remains in your learning history.")
                .font(.caption)
                .foregroundStyle(Color.milaMuted)
        }
    }

    private func bubble(label: String, text: String, color: Color, replay: (() -> Void)? = nil) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(label.uppercased())
                    .font(.system(size: 9, weight: .black)).tracking(1.3).foregroundStyle(color)
                Spacer()
                if let replay {
                    Button(action: replay) {
                        Image(systemName: "speaker.wave.2.fill").foregroundStyle(Color.milaCyan)
                    }
                    .accessibilityLabel(language == .ru ? "Повторить ответ" : "Replay reply")
                }
            }
            Text(text).font(.body).foregroundStyle(Color.milaCream).textSelection(.enabled)
        }
        .milaCard()
    }

    private var microphoneIcon: String {
        voice.state == .recording ? "stop.fill" : "mic.fill"
    }

    private var microphoneColor: Color {
        voice.state == .recording ? .milaPink : .milaCyan
    }

    private var microphoneLabel: String {
        voice.state == .recording
            ? (language == .ru ? "Остановить запись" : "Stop recording")
            : (language == .ru ? "Начать запись" : "Start recording")
    }

    private var statusColor: Color {
        if case .failed = voice.state { return .milaPink }
        return voice.state == .recording ? .milaPink : .milaMuted
    }

    private var statusText: String {
        switch voice.state {
        case .idle:
            if !network.isConnected { return language == .ru ? "Для разговора нужна сеть" : "Connect to speak" }
            return language == .ru ? "Готова слушать" : "Ready to listen"
        case .recording: return language == .ru ? "Слушаю… нажми, чтобы закончить" : "Listening… tap to finish"
        case .transcribing: return language == .ru ? "Разбираю речь…" : "Transcribing…"
        case .thinking: return language == .ru ? "Преподаватель думает…" : "Your teacher is thinking…"
        case .speaking: return language == .ru ? "Преподаватель отвечает" : "Your teacher is speaking"
        case .failed(let message): return message
        }
    }
}
