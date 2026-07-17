import AVFoundation
import Foundation

@MainActor
final class VoicePracticeModel: NSObject, ObservableObject, AVAudioRecorderDelegate, AVAudioPlayerDelegate {
    enum State: Equatable {
        case idle
        case recording
        case transcribing
        case thinking
        case speaking
        case failed(String)
    }

    @Published private(set) var state: State = .idle
    @Published private(set) var transcript = ""
    @Published private(set) var reply = ""

    private var recorder: AVAudioRecorder?
    private var player: AVAudioPlayer?
    private var recordingURL: URL?

    var isBusy: Bool {
        switch state {
        case .transcribing, .thinking, .speaking: return true
        default: return false
        }
    }

    func toggle(language: AppLanguage) async {
        if state == .recording {
            await finish(language: language)
        } else {
            await start()
        }
    }

    func start() async {
        transcript = ""
        reply = ""
        do {
            let granted = await requestMicrophonePermission()
            guard granted else {
                state = .failed("Microphone access is off. Enable it in Settings to practise speaking.")
                return
            }
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .spokenAudio, options: [.defaultToSpeaker, .allowBluetoothHFP])
            try audioSession.setActive(true)

            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("mila-practice-\(UUID().uuidString).m4a")
            let settings: [String: Any] = [
                AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
                AVSampleRateKey: 44_100,
                AVNumberOfChannelsKey: 1,
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
            ]
            let recorder = try AVAudioRecorder(url: url, settings: settings)
            recorder.delegate = self
            recorder.prepareToRecord()
            guard recorder.record() else { throw MilaAPIError.invalidResponse }
            self.recorder = recorder
            recordingURL = url
            state = .recording
        } catch {
            state = .failed(error.localizedDescription)
        }
    }

    func finish(language: AppLanguage) async {
        guard let url = recordingURL else { return }
        recorder?.stop()
        recorder = nil
        state = .transcribing
        do {
            let result = try await MilaAPI.shared.transcribe(audioURL: url, language: language)
            transcript = result.text
            state = .thinking
            reply = try await MilaAPI.shared.sendChat(
                text: result.text,
                language: language,
                surface: "voice",
                pathname: "/ios/speak"
            )
            try? FileManager.default.removeItem(at: url)
            await playReply()
        } catch {
            try? FileManager.default.removeItem(at: url)
            state = .failed(error.localizedDescription)
        }
    }

    func replay() async { await playReply() }

    private func playReply() async {
        guard !reply.isEmpty else { state = .idle; return }
        do {
            let data = try await MilaAPI.shared.synthesize(text: reply)
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
            try audioSession.setActive(true)
            let player = try AVAudioPlayer(data: data)
            player.delegate = self
            player.prepareToPlay()
            self.player = player
            state = player.play() ? .speaking : .idle
        } catch {
            state = .idle
        }
    }

    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in self.state = .idle }
    }

    private func requestMicrophonePermission() async -> Bool {
        await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
    }
}
