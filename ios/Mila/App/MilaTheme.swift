import SwiftUI

extension Color {
    init(hex: UInt, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xff) / 255,
            green: Double((hex >> 8) & 0xff) / 255,
            blue: Double(hex & 0xff) / 255,
            opacity: alpha
        )
    }

    static let milaBlack = Color(hex: 0x050506)
    static let milaPanel = Color(hex: 0x121216)
    static let milaPanelRaised = Color(hex: 0x1a1a20)
    static let milaCyan = Color(hex: 0x78e3f8)
    static let milaPink = Color(hex: 0xff7f9f)
    static let milaCream = Color(hex: 0xfff4ee)
    static let milaMuted = Color(hex: 0xa6a4ad)
    static let milaGreen = Color(hex: 0x72e6b1)
}

struct MilaCardModifier: ViewModifier {
    var padding: CGFloat = 18

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(Color.milaPanel)
                    .overlay(
                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                    )
            )
    }
}

extension View {
    func milaCard(padding: CGFloat = 18) -> some View {
        modifier(MilaCardModifier(padding: padding))
    }
}

struct MilaMark: View {
    var size: CGFloat = 54

    var body: some View {
        Image("MilaMascot")
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .accessibilityLabel("Mila")
    }
}

struct MilaWordmark: View {
    var body: some View {
        HStack(spacing: 10) {
            MilaMark(size: 42)
            VStack(alignment: .leading, spacing: 0) {
                Text("Mila")
                    .font(.system(size: 25, weight: .black, design: .rounded))
                    .foregroundStyle(Color.milaCream)
                Text("ENGLISH STUDIO")
                    .font(.system(size: 8, weight: .bold, design: .rounded))
                    .tracking(2.2)
                    .foregroundStyle(Color.milaCyan)
            }
        }
    }
}

struct MilaBackground: View {
    var body: some View {
        ZStack {
            Color.milaBlack
            RadialGradient(
                colors: [Color.milaCyan.opacity(0.09), .clear],
                center: .topTrailing,
                startRadius: 10,
                endRadius: 370
            )
            RadialGradient(
                colors: [Color.milaPink.opacity(0.08), .clear],
                center: .bottomLeading,
                startRadius: 20,
                endRadius: 420
            )
        }
        .ignoresSafeArea()
    }
}
