import SwiftUI
import WebKit

struct WebModuleView: View {
    @Environment(\.dismiss) private var dismiss
    let destination: WebDestination
    @State private var progress = 0.0
    @State private var loading = true
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Color.milaBlack.ignoresSafeArea()
                MilaWebView(
                    url: MilaAPI.webURL(path: destination.path),
                    progress: $progress,
                    loading: $loading,
                    error: $error
                )
                if loading {
                    VStack(spacing: 12) {
                        MilaMark(size: 64)
                        ProgressView(value: progress).tint(Color.milaCyan).frame(width: 150)
                        Text("Loading Mila…").font(.caption).foregroundStyle(Color.milaMuted)
                    }
                    .padding(22)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
                }
                if let error {
                    VStack(spacing: 12) {
                        Image(systemName: "wifi.exclamationmark").font(.largeTitle).foregroundStyle(Color.milaPink)
                        Text(error).multilineTextAlignment(.center).foregroundStyle(Color.milaCream)
                    }
                    .padding(24)
                    .milaCard()
                    .padding()
                }
            }
            .navigationTitle(destination.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }.foregroundStyle(Color.milaCyan)
                }
            }
        }
    }
}

private struct MilaWebView: UIViewRepresentable {
    let url: URL
    @Binding var progress: Double
    @Binding var loading: Bool
    @Binding var error: String?

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        view.isOpaque = false
        view.backgroundColor = UIColor(Color.milaBlack)
        view.scrollView.backgroundColor = UIColor(Color.milaBlack)
        view.allowsBackForwardNavigationGestures = true
        context.coordinator.observation = view.observe(\.estimatedProgress, options: [.new]) { _, change in
            Task { @MainActor in self.progress = change.newValue ?? 0 }
        }
        view.load(URLRequest(url: url, cachePolicy: .reloadRevalidatingCacheData))
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        var parent: MilaWebView
        var observation: NSKeyValueObservation?

        init(_ parent: MilaWebView) { self.parent = parent }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.loading = true
            parent.error = nil
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.loading = false
            parent.progress = 1
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.loading = false
            parent.error = error.localizedDescription
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            parent.loading = false
            parent.error = error.localizedDescription
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let target = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }
            if target.host == MilaAPI.baseURL.host || target.scheme == "about" {
                decisionHandler(.allow)
            } else {
                decisionHandler(.cancel)
                Task { @MainActor in UIApplication.shared.open(target) }
            }
        }

        @available(iOS 15.0, *)
        func webView(
            _ webView: WKWebView,
            requestMediaCapturePermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            type: WKMediaCaptureType,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
            decisionHandler(origin.host == MilaAPI.baseURL.host ? .prompt : .deny)
        }
    }
}
