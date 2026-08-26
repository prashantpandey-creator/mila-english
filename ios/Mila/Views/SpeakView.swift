import SwiftUI

/// Embeds Mila's OpenAI Realtime voice room (/darshan) instead of driving a
/// native record→self-hosted-ASR→chat→self-hosted-TTS loop. The self-hosted
/// CPU cascade (faster-whisper + Piper) that VoicePracticeModel used to call
/// has a hard latency ceiling — matching OpenAI Realtime on-box needs a GPU,
/// which the shared Mumbai host doesn't have. /darshan already runs the exact
/// OpenAI Realtime pipeline in production for the web app's flagship voice
/// room; embedding it here (same pattern WebModuleView already uses for
/// /assessment, /chat, /grammar, /listen) gets the native app that latency
/// for free instead of trying to out-engineer physics on CPU.
struct SpeakView: View {
    @EnvironmentObject private var network: NetworkMonitor
    let language: Binding<AppLanguage>
    @State private var progress = 0.0
    @State private var loading = true
    @State private var error: String?

    var body: some View {
        ZStack {
            Color.milaBlack.ignoresSafeArea()
            if network.isConnected {
                MilaWebView(
                    url: MilaAPI.webURL(path: "/darshan"),
                    progress: $progress,
                    loading: $loading,
                    error: $error
                )
                .ignoresSafeArea(edges: .bottom)
            } else {
                offline
            }
            if loading && network.isConnected {
                loadingOverlay
            }
            if let error {
                errorOverlay(error)
            }
        }
    }

    private var loadingOverlay: some View {
        VStack(spacing: 12) {
            MilaMark(size: 64)
            ProgressView(value: progress).tint(Color.milaCyan).frame(width: 150)
            Text(language.wrappedValue == .ru ? "Открываю Mila…" : "Opening Mila…")
                .font(.caption)
                .foregroundStyle(Color.milaMuted)
        }
        .padding(22)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
    }

    private func errorOverlay(_ message: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "wifi.exclamationmark").font(.largeTitle).foregroundStyle(Color.milaPink)
            Text(message).multilineTextAlignment(.center).foregroundStyle(Color.milaCream)
        }
        .padding(24)
        .milaCard()
        .padding()
    }

    private var offline: some View {
        VStack(spacing: 12) {
            Image(systemName: "wifi.slash").font(.largeTitle).foregroundStyle(Color.milaPink)
            Text(language.wrappedValue == .ru ? "Для разговора нужна сеть" : "Connect to speak")
                .foregroundStyle(Color.milaCream)
        }
        .padding(24)
        .milaCard()
        .padding()
    }
}
