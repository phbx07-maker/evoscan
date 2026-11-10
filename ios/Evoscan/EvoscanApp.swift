//
//  EvoscanApp.swift
//  Evoscan - Evofranklin Technology
//
//  Target: iOS 17.2+
//  Bundle ID: com.evofranklin.evoscan
//

import SwiftUI

@main
struct EvoscanApp: App {
    init() {
        // Konfigurasi status bar & background AMOLED
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(red: 8/255, green: 11/255, blue: 17/255, alpha: 1.0)
        appearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        
        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
                .background(Color(red: 8/255, green: 11/255, blue: 17/255))
        }
    }
}
