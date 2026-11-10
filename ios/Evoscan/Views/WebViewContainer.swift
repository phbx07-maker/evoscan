//
//  WebViewContainer.swift
//  Evoscan - Evofranklin Technology
//
//  Target: iOS 17.2+
//

import SwiftUI
import WebKit

struct WebViewContainer: UIViewRepresentable {
    let urlString: String
    @Binding var isLoading: Bool
    @Binding var canGoBack: Bool
    @Binding var reloadTrigger: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true

        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences = preferences
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = WKWebsiteDataStore.default()

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 8/255, green: 11/255, blue: 17/255, alpha: 1.0)
        webView.scrollView.backgroundColor = UIColor(red: 8/255, green: 11/255, blue: 17/255, alpha: 1.0)
        webView.scrollView.contentInsetAdjustmentBehavior = .always
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 EvoFranklin-Evoscan-iOS/1.0.0"

        // Pull to refresh native iOS
        let refreshControl = UIRefreshControl()
        refreshControl.tintColor = UIColor(red: 6/255, green: 182/255, blue: 212/255, alpha: 1.0) // Cyan
        refreshControl.addTarget(context.coordinator, action: #selector(Coordinator.handleRefresh(_:)), for: .valueChanged)
        webView.scrollView.refreshControl = refreshControl

        if let url = URL(string: urlString) {
            let request = URLRequest(url: url, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 30)
            webView.load(request)
        }

        context.coordinator.webView = webView
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        if reloadTrigger {
            uiView.reload()
            DispatchQueue.main.async {
                self.reloadTrigger = false
            }
        }
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: WebViewContainer
        weak var webView: WKWebView?
        let haptic = UIImpactFeedbackGenerator(style: .medium)

        init(_ parent: WebViewContainer) {
            self.parent = parent
        }

        @objc func handleRefresh(_ sender: UIRefreshControl) {
            haptic.impactOccurred()
            webView?.reload()
            sender.endRefreshing()
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = true
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.canGoBack = webView.canGoBack
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
            }
        }
    }
}
