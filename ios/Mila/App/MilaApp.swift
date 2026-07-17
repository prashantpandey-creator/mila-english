import SwiftUI

@main
struct MilaApp: App {
    @StateObject private var session = SessionStore()
    @StateObject private var network = NetworkMonitor()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(session)
                .environmentObject(network)
                .preferredColorScheme(.dark)
                .task { await session.bootstrap() }
        }
    }
}
