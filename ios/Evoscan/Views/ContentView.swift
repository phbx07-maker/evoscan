//
//  ContentView.swift
//  Evoscan - Evofranklin Technology
//
//  Target: iOS 17.2+
//

import SwiftUI

struct ContentView: View {
    // URL backend / UI Evoscan
    private let appURL = "https://evoscan-1.ai.studio"
    
    @State private var isLoading = true
    @State private var canGoBack = false
    @State private var reloadTrigger = false

    var body: some View {
        ZStack {
            Color(red: 8/255, green: 11/255, blue: 17/255)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                WebViewContainer(
                    urlString: appURL,
                    isLoading: $isLoading,
                    canGoBack: $canGoBack,
                    reloadTrigger: $reloadTrigger
                )
            }
            .ignoresSafeArea(.keyboard, edges: .bottom)

            // Progress bar tipis di atas saat memuat
            if isLoading {
                VStack {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: Color(red: 6/255, green: 182/255, blue: 212/255)))
                        .scaleEffect(1.2)
                        .padding(.top, 60)
                    Spacer()
                }
                .transition(.opacity)
            }
        }
        .preferredColorScheme(.dark)
    }
}

#Preview {
    ContentView()
}
