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
                        Text("Loading FluentMitra…").font(.caption).foregroundStyle(Color.milaMuted)
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
        context.coordinator.loadAuthenticatedModule(url, in: view)
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        private static let allowedRoutePrefixes = [
            "/achievements",
            "/assessment",
            "/chat",
            "/darshan",
            "/dashboard",
            "/grammar",
            "/lessons",
            "/listen",
            "/phonetics",
            "/practice",
            "/privacy",
            "/progress",
            "/support",
            "/terms",
            "/vocabulary",
            "/voice-lab",
        ]

        var parent: MilaWebView
        var observation: NSKeyValueObservation?

        init(_ parent: MilaWebView) { self.parent = parent }

        /// URLSession and WKWebView intentionally use separate cookie stores on
        /// iOS. Mila authenticates in URLSession, so copy the current first-party
        /// session into WebKit before loading a protected learning module. Delete
        /// any older WebKit token first so sign-out or account switching cannot
        /// reopen a previous learner's web session.
        func loadAuthenticatedModule(_ url: URL, in webView: WKWebView) {
            guard Self.isAllowedModuleURL(url) else {
                parent.loading = false
                parent.error = "This page is not available inside the FluentMitra app."
                return
            }

            let cookieStore = webView.configuration.websiteDataStore.httpCookieStore
            let nativeToken = HTTPCookieStorage.shared.cookies(for: MilaAPI.baseURL)?
                .first(where: { $0.name == "token" && Self.cookieBelongsToMila($0) })

            cookieStore.getAllCookies { cookies in
                let staleTokens = cookies.filter { $0.name == "token" && Self.cookieBelongsToMila($0) }
                let deletion = DispatchGroup()
                for cookie in staleTokens {
                    deletion.enter()
                    cookieStore.delete(cookie) { deletion.leave() }
                }

                deletion.notify(queue: .main) {
                    guard let nativeToken else {
                        if Self.isPublicModuleURL(url) {
                            webView.load(URLRequest(url: url, cachePolicy: .reloadRevalidatingCacheData))
                        } else {
                            self.parent.loading = false
                            self.parent.error = "Your FluentMitra session expired. Close this window and sign in again."
                        }
                        return
                    }
                    cookieStore.setCookie(nativeToken) {
                        DispatchQueue.main.async {
                            webView.load(URLRequest(url: url, cachePolicy: .reloadRevalidatingCacheData))
                        }
                    }
                }
            }
        }

        private static func cookieBelongsToMila(_ cookie: HTTPCookie) -> Bool {
            guard let host = MilaAPI.baseURL.host?.lowercased() else { return false }
            let domain = cookie.domain.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: "."))
            return domain == host || host.hasSuffix(".\(domain)")
        }

        private static func isPublicModuleURL(_ url: URL) -> Bool {
            ["/privacy", "/support", "/terms"].contains(url.path)
        }

        private static func isAllowedModuleURL(_ url: URL) -> Bool {
            guard
                let baseHost = MilaAPI.baseURL.host?.lowercased(),
                url.host?.lowercased() == baseHost,
                url.scheme?.lowercased() == MilaAPI.baseURL.scheme?.lowercased(),
                url.port == MilaAPI.baseURL.port
            else { return false }

            let path = url.path.isEmpty ? "/" : url.path
            return allowedRoutePrefixes.contains { prefix in
                path == prefix || path.hasPrefix("\(prefix)/")
            }
        }

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
            if target.scheme == "about" || Self.isAllowedModuleURL(target) {
                decisionHandler(.allow)
            } else if target.scheme == "mailto" {
                decisionHandler(.cancel)
                Task { @MainActor in UIApplication.shared.open(target) }
            } else {
                decisionHandler(.cancel)
                // Native Mila intentionally contains no route to web checkout,
                // account acquisition, or an external purchase page. Authentication
                // and account management stay in the native Account sheet.
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
