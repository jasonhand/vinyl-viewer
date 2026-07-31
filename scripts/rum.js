(function initializeDatadogRum(window, document) {
    const sensitiveDiscogsUserPath = /(\/users\/)[^/?#]+/gi;

    function sanitizeUrl(value) {
        if (typeof value !== "string") return value;
        try {
            const url = new URL(value, window.location.origin);
            url.pathname = url.pathname.replace(sensitiveDiscogsUserPath, "$1[redacted]");
            url.search = "";
            url.hash = "";
            return url.toString();
        } catch {
            return value.replace(sensitiveDiscogsUserPath, "$1[redacted]").split(/[?#]/, 1)[0];
        }
    }

    function scrubEvent(event) {
        if (event.view) {
            event.view.url = sanitizeUrl(event.view.url);
            event.view.referrer = sanitizeUrl(event.view.referrer);
        }
        if (event.resource) event.resource.url = sanitizeUrl(event.resource.url);
        if (event.error?.resource) event.error.resource.url = sanitizeUrl(event.error.resource.url);
        return true;
    }

    window.DD_RUM = window.DD_RUM || {
        q: [],
        onReady(callback) {
            this.q.push(callback);
        },
    };

    window.vinylRum = {
        track(name, context = {}) {
            window.DD_RUM.onReady(() => window.DD_RUM.addAction(name, context));
        },
        report(error, context = {}) {
            window.DD_RUM.onReady(() => window.DD_RUM.addError(error, context));
        },
    };

    window.DD_RUM.onReady(() => {
        const hostname = window.location.hostname;
        const deployment = hostname === "jasonhand.github.io"
            ? "github-pages"
            : hostname.endsWith("vinylviewer.com")
                ? "netlify"
                : "local";

        window.DD_RUM.init({
            applicationId: "709e7d93-9fec-4547-9721-154d38c929ae",
            clientToken: "pub5a255831bb1d714c4e0eb2adbd200a22",
            site: "datadoghq.com",
            service: "vinyl-viewer",
            env: deployment === "local" ? "development" : "production",
            sessionSampleRate: 100,
            sessionReplaySampleRate: 0,
            trackUserInteractions: true,
            trackResources: true,
            trackLongTasks: true,
            enablePrivacyForActionName: true,
            defaultPrivacyLevel: "mask",
            beforeSend: scrubEvent,
        });
        window.DD_RUM.setGlobalContextProperty("deployment", deployment);
        window.DD_RUM.setGlobalContextProperty("seller_feature_enabled", ["1", "true"].includes(
            (new URLSearchParams(window.location.search).get("seller") || "").toLocaleLowerCase(),
        ));
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.datadoghq-browser-agent.com/us1/v7/datadog-rum.js";
    document.head.append(script);
}(window, document));
