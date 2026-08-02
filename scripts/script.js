document.addEventListener("DOMContentLoaded", () => {
    const elements = {
        aboutPage: document.querySelector("#about-page"),
        analyticsDashboard: document.querySelector("#analytics-dashboard"),
        cardContainer: document.querySelector("#card-container"),
        cardTemplate: document.querySelector("#record-card-template"),
        clearSharedView: document.querySelector("#clear-shared-view"),
        collectionPanel: document.querySelector("#collection-panel"),
        collectionControls: document.querySelector("#collection-controls"),
        collectionCount: document.querySelector("#collection-count"),
        collectionHeading: document.querySelector("#collection-heading"),
        connectButton: document.querySelector("#connect-button"),
        connectedUsername: document.querySelector("#connected-username"),
        connectionError: document.querySelector("#connection-error"),
        connectionForm: document.querySelector("#connection-form"),
        connectionScreen: document.querySelector("#connection-screen"),
        closeModal: document.querySelector("#close-modal"),
        disconnectButton: document.querySelector("#disconnect-button"),
        modal: document.querySelector("#modal"),
        modalContent: document.querySelector("#modal-content"),
        modalDialog: document.querySelector(".modal-dialog"),
        navigationRow: document.querySelector("#navigation-row"),
        resultCount: document.querySelector("#result-count"),
        searchInput: document.querySelector("#search-input"),
        sectionEyebrow: document.querySelector("#section-eyebrow"),
        sellerCount: document.querySelector("#seller-count"),
        sellerNext: document.querySelector("#seller-next"),
        sellerPageStatus: document.querySelector("#seller-page-status"),
        sellerPagination: document.querySelector("#seller-pagination"),
        sellerPrevious: document.querySelector("#seller-previous"),
        sellerProfileLink: document.querySelector("#seller-profile-link"),
        sellerViewButton: document.querySelector("#seller-view-button"),
        shareCurrentButton: document.querySelector("#share-current-button"),
        shareCurrentCount: document.querySelector("#share-current-count"),
        shareCustomButton: document.querySelector("#share-custom-button"),
        shareDescription: document.querySelector("#share-description"),
        shareFullButton: document.querySelector("#share-full-button"),
        shareFullCount: document.querySelector("#share-full-count"),
        sharePage: document.querySelector("#share-page"),
        shareResult: document.querySelector("#share-result"),
        shareStatus: document.querySelector("#share-status"),
        shareUrl: document.querySelector("#share-url"),
        sharedBanner: document.querySelector("#shared-banner"),
        sharedDescription: document.querySelector("#shared-description"),
        shuffleButton: document.querySelector("#shuffle-button"),
        sortSelect: document.querySelector("#sort-select"),
        statusMessage: document.querySelector("#status-message"),
        supportButtons: [...document.querySelectorAll("[data-support-tier]")],
        copyShareUrl: document.querySelector("#copy-share-url"),
        createCustomShare: document.querySelector("#create-custom-share"),
        customSelectionCount: document.querySelector("#custom-selection-count"),
        customShareGrid: document.querySelector("#custom-share-grid"),
        customSharePanel: document.querySelector("#custom-share-panel"),
        customShareSearch: document.querySelector("#custom-share-search"),
        selectAllShare: document.querySelector("#select-all-share"),
        clearShareSelection: document.querySelector("#clear-share-selection"),
        usernameInput: document.querySelector("#username-input"),
        viewButtons: [...document.querySelectorAll("[data-view]")],
        wantlistCount: document.querySelector("#wantlist-count"),
    };

    const state = {
        activeView: "collection",
        analyticsScope: "collection",
        artistFilter: "",
        artistMetadata: new Map(),
        customShareIds: new Set(),
        lastFocusedElement: null,
        labelFilter: "",
        localMetadata: new Map(),
        modalRequestId: 0,
        pendingShare: null,
        profile: null,
        records: [],
        isSharedView: false,
        sharedDescription: "",
        sharedRecordIds: null,
        shuffleOrder: new Map(),
        sellerError: "",
        sellerInventoryPage: 0,
        sellerInventoryPages: 0,
        sellerInventoryTotal: null,
        sellerLoading: false,
        sellerRecords: [],
        wantlistRecords: [],
    };

    const DEFAULT_USERNAME = "jasonhand24";
    const DISCOGS_API = "https://api.discogs.com";
    const DISCOGS_REQUEST_INTERVAL = 2600;
    const DISCOGS_RETRY_DELAY = 5000;
    const MAX_SHARE_DESCRIPTION_LENGTH = 500;
    const MAX_SHARE_IDS = 500;
    const MAX_SHARE_QUERY_LENGTH = 100;
    const MAX_USERNAME_LENGTH = 64;
    const SELLER_PAGE_SIZE = 50;
    const sellerFeatureEnabled = ["1", "true"].includes(
        (new URLSearchParams(window.location.search).get("seller") || "").toLocaleLowerCase(),
    );
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    const localMetadataPromise = loadLocalMetadata();
    let lastDiscogsRequestTime = 0;
    let discogsRequestQueue = Promise.resolve();

    function trackRum(name, context = {}) {
        window.vinylRum?.track(name, context);
    }

    function reportRumError(message, error, context = {}) {
        window.vinylRum?.report(new Error(message), {
            ...context,
            status_code: Number.isFinite(error?.status) ? error.status : undefined,
        });
    }

    function shuffle(records) {
        const shuffled = [...records];
        for (let index = shuffled.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
        }
        state.shuffleOrder = new Map(shuffled.map((record, index) => [record.id, index]));
    }

    function isSafeUrl(value) {
        if (!value) return false;
        try {
            return new URL(value).protocol === "https:";
        } catch {
            return false;
        }
    }

    function isSafeExternalUrl(value) {
        if (!value) return false;
        try {
            return new URL(value).protocol === "https:";
        } catch {
            return false;
        }
    }

    function formatNames(items) {
        return (items || []).map((item) => item.name).filter(Boolean).join(", ");
    }

    function formatDiscogsRecord(entry, index, folders, source) {
        const record = entry.basic_information || {};
        const firstLabel = record.labels?.[0];
        const format = (record.formats || []).map((item) => {
            const descriptions = item.descriptions?.length ? `, ${item.descriptions.join(", ")}` : "";
            return `${item.name || ""}${descriptions}`;
        }).filter(Boolean).join("; ");
        const collection = source === "collection"
            ? folders.get(entry.folder_id) || "Collection"
            : record.styles?.[0] || record.genres?.[0] || "Wantlist";

        return {
            id: String(record.id ?? `discogs-${source}-${index}`),
            shareId: String(entry.instance_id ?? `${source}-${record.id ?? index}`),
            artist: formatNames(record.artists) || "Unknown artist",
            artistNames: (record.artists || []).map((artist) => artist.name).filter(Boolean),
            discogsArtistUrl: isSafeUrl(record.artists?.[0]?.resource_url)
                ? record.artists[0].resource_url.replace("api.discogs.com/artists", "www.discogs.com/artist")
                : "",
            title: String(record.title || "Untitled record"),
            genres: (record.genres || []).filter(Boolean),
            label: String(firstLabel?.name || ""),
            format,
            rating: Number(entry.rating) > 0 ? Number(entry.rating) : null,
            releaseYear: Number(record.year) > 0 ? Number(record.year) : null,
            catalogNumber: String(firstLabel?.catno || ""),
            collection,
            dateAdded: String(entry.date_added || ""),
            albumArt: isSafeUrl(record.cover_image) ? record.cover_image : isSafeUrl(record.thumb) ? record.thumb : "",
            spotifyUrl: "",
            low: "",
            median: "",
            high: "",
        };
    }

    function formatSellerListing(listing, index) {
        const release = listing.release || {};
        const formattedPrice = listing.original_price?.formatted
            || (listing.price?.value && listing.price?.currency
                ? `${listing.price.value} ${listing.price.currency}`
                : "");
        return {
            id: String(release.id ?? `seller-${index}`),
            shareId: `listing-${listing.id ?? index}`,
            artist: String(release.artist || "Unknown artist"),
            artistNames: release.artist ? [release.artist] : [],
            discogsArtistUrl: "",
            title: String(release.title || "Untitled record"),
            genres: [],
            label: String(release.label || ""),
            format: String(release.format || ""),
            rating: null,
            releaseYear: Number(release.year) > 0 ? Number(release.year) : null,
            catalogNumber: String(release.catalog_number || ""),
            collection: "For Sale",
            dateAdded: String(listing.posted || ""),
            albumArt: isSafeUrl(release.thumbnail) ? release.thumbnail : "",
            spotifyUrl: "",
            low: "",
            median: "",
            high: "",
            listingId: String(listing.id || ""),
            listingUrl: isSafeUrl(listing.uri) ? listing.uri : "",
            sellerPrice: formattedPrice,
            mediaCondition: String(listing.condition || ""),
            sleeveCondition: String(listing.sleeve_condition || ""),
            shipsFrom: String(listing.ships_from || ""),
            sellerComments: String(listing.comments || ""),
            allowOffers: Boolean(listing.allow_offers),
        };
    }

    async function loadLocalMetadata() {
        try {
            const response = await fetch("data/spotify-albums.json");
            if (!response.ok) return;
            const data = await response.json();
            if (!data || Array.isArray(data) || typeof data !== "object") return;
            state.localMetadata = new Map(
                Object.entries(data).map(([releaseId, spotifyUrl]) => [
                    releaseId,
                    { spotifyUrl: isSafeUrl(spotifyUrl) ? spotifyUrl : "" },
                ]),
            );
        } catch (error) {
            console.warn("Local Spotify metadata could not be loaded:", error);
        }
    }

    function enrichWithLocalMetadata(records) {
        records.forEach((record) => {
            const metadata = state.localMetadata.get(record.id);
            if (!metadata) return;
            record.spotifyUrl = metadata.spotifyUrl;
        });
    }

    function fetchDiscogs(path) {
        const request = discogsRequestQueue.then(async () => {
            let response;
            for (let attempt = 0; attempt < 2; attempt += 1) {
                const waitTime = DISCOGS_REQUEST_INTERVAL - (Date.now() - lastDiscogsRequestTime);
                if (waitTime > 0) {
                    await new Promise((resolve) => window.setTimeout(resolve, waitTime));
                }
                lastDiscogsRequestTime = Date.now();

                try {
                    response = await fetch(`${DISCOGS_API}${path}`, {
                        headers: { Accept: "application/vnd.discogs.v2.discogs+json" },
                    });
                    break;
                } catch (error) {
                    if (!(error instanceof TypeError) || attempt === 1) throw error;
                    await new Promise((resolve) => window.setTimeout(resolve, DISCOGS_RETRY_DELAY));
                }
            }

            if (!response.ok) {
                let message = "";
                try {
                    message = (await response.json()).message || "";
                } catch {
                    message = "";
                }
                const error = new Error(message || `Discogs request failed with status ${response.status}`);
                error.status = response.status;
                throw error;
            }
            return response.json();
        });
        discogsRequestQueue = request.catch(() => {});
        return request;
    }

    async function fetchAllPages(path, responseKey) {
        const separator = path.includes("?") ? "&" : "?";
        const firstPage = await fetchDiscogs(`${path}${separator}per_page=100&page=1`);
        const items = [...(firstPage[responseKey] || [])];
        const pages = firstPage.pagination?.pages || 1;

        for (let page = 2; page <= pages; page += 1) {
            const response = await fetchDiscogs(`${path}${separator}per_page=100&page=${page}`);
            items.push(...(response[responseKey] || []));
        }
        return items;
    }

    async function loadDiscogsUser(username) {
        const encodedUsername = encodeURIComponent(username);
        const folderResponse = await fetchDiscogs(`/users/${encodedUsername}/collection/folders`);
        const collectionEntries = await fetchAllPages(
            `/users/${encodedUsername}/collection/folders/0/releases`,
            "releases",
        );
        const wantlistEntries = await fetchAllPages(`/users/${encodedUsername}/wants`, "wants");
        const folders = new Map(
            (folderResponse.folders || []).map((folder) => [folder.id, folder.name || "Collection"]),
        );

        return {
            profile: { username },
            records: collectionEntries.map((entry, index) => formatDiscogsRecord(entry, index, folders, "collection")),
            wantlistRecords: wantlistEntries.map((entry, index) => formatDiscogsRecord(entry, index, folders, "wantlist")),
        };
    }

    async function loadSellerInventoryPage(page) {
        if (!state.profile || state.sellerLoading) return;
        state.sellerLoading = true;
        state.sellerError = "";
        renderRecords();
        try {
            const username = encodeURIComponent(state.profile.username);
            const response = await fetchDiscogs(
                `/users/${username}/inventory?status=For%20Sale&sort=listed&sort_order=desc&per_page=${SELLER_PAGE_SIZE}&page=${page}`,
            );
            state.sellerRecords = (response.listings || []).map(formatSellerListing);
            enrichWithLocalMetadata(state.sellerRecords);
            state.sellerInventoryPage = response.pagination?.page || page;
            state.sellerInventoryPages = response.pagination?.pages || 0;
            state.sellerInventoryTotal = response.pagination?.items || 0;
            trackRum("seller_inventory_loaded", {
                page: state.sellerInventoryPage,
                page_count: state.sellerInventoryPages,
                result_count: state.sellerRecords.length,
            });
        } catch (error) {
            console.error("Unable to load seller inventory:", error);
            reportRumError("Discogs seller inventory request failed", error, { operation: "seller_inventory" });
            state.sellerError = error.status === 404
                ? `@${state.profile.username} does not have a public seller inventory.`
                : "This seller inventory could not be loaded from Discogs. Try again shortly.";
        } finally {
            state.sellerLoading = false;
            updateNavigation();
            renderRecords();
        }
    }

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value.replace(" ", "T"));
        if (Number.isNaN(date.getTime())) return "";
        return new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        }).format(date);
    }

    function createTag(text) {
        const tag = document.createElement("span");
        tag.className = "meta-tag";
        tag.textContent = text;
        return tag;
    }

    function updateNavigation() {
        elements.collectionCount.textContent = getSharedCollectionRecords().length;
        elements.wantlistCount.textContent = state.wantlistRecords.length;
        elements.sellerCount.textContent = state.sellerInventoryTotal === null
            ? "—"
            : state.sellerInventoryTotal.toLocaleString();
        elements.viewButtons.forEach((button) => {
            const isActive = button.dataset.view === state.activeView;
            button.classList.toggle("is-active", isActive);
            if (isActive) {
                button.setAttribute("aria-current", "page");
            } else {
                button.removeAttribute("aria-current");
            }
        });
    }

    function renderCard(record) {
        const fragment = elements.cardTemplate.content.cloneNode(true);
        const button = fragment.querySelector(".record-card-button");
        const image = fragment.querySelector(".cover-image");
        const fallback = fragment.querySelector(".cover-fallback");
        const metadata = fragment.querySelector(".record-meta");

        fragment.querySelector(".record-artist").textContent = record.artist;
        fragment.querySelector(".record-title").textContent = record.title;

        if (record.albumArt) {
            image.src = record.albumArt;
            image.alt = `Cover of ${record.title} by ${record.artist}`;
            image.referrerPolicy = "no-referrer";
            image.addEventListener("error", () => {
                image.remove();
                fallback.classList.add("is-visible");
            }, { once: true });
        } else {
            image.remove();
            fallback.classList.add("is-visible");
        }

        if (record.collection && record.collection !== "Collection") metadata.append(createTag(record.collection));
        if (record.sellerPrice) metadata.append(createTag(record.sellerPrice));
        if (record.releaseYear) {
            const year = document.createElement("time");
            year.className = "record-year";
            year.dateTime = String(record.releaseYear);
            year.textContent = String(record.releaseYear);
            metadata.append(year);
        }
        if (record.rating) metadata.append(createTag(`${record.rating}/5 ★`));

        button.setAttribute("aria-label", `View ${record.title} by ${record.artist}`);
        button.dataset.releaseId = record.id;
        button.addEventListener("click", () => openModal(record));
        elements.cardContainer.append(fragment);
    }

    function recordMatchesQuery(record, query) {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        if (!normalizedQuery) return true;
        if (state.artistFilter && normalizedQuery === state.artistFilter.toLocaleLowerCase()) {
            const artistNames = record.artistNames?.length ? record.artistNames : [record.artist];
            return artistNames.some((artist) => artist.toLocaleLowerCase() === normalizedQuery);
        }
        if (state.labelFilter && normalizedQuery === state.labelFilter.toLocaleLowerCase()) {
            return record.label.toLocaleLowerCase() === normalizedQuery;
        }
        const searchText = `${record.artist} ${record.title} ${record.label} ${record.catalogNumber} ${record.sellerComments || ""}`.toLocaleLowerCase();
        return searchText.includes(normalizedQuery);
    }

    function filterAndSortRecords(sourceRecords) {
        const query = elements.searchInput.value;
        const sort = elements.sortSelect.value;
        const visibleRecords = sourceRecords.filter((record) => recordMatchesQuery(record, query));

        const sorters = {
            artist: (first, second) => collator.compare(first.artist, second.artist) || collator.compare(first.title, second.title),
            title: (first, second) => collator.compare(first.title, second.title) || collator.compare(first.artist, second.artist),
            newest: (first, second) => second.dateAdded.localeCompare(first.dateAdded),
            rating: (first, second) => (second.rating || 0) - (first.rating || 0) || collator.compare(first.artist, second.artist),
            shuffle: (first, second) => state.shuffleOrder.get(first.id) - state.shuffleOrder.get(second.id),
        };

        return visibleRecords.sort(sorters[sort] || sorters.shuffle);
    }

    function getVisibleRecords() {
        const sourceRecords = state.activeView === "wantlist"
            ? state.wantlistRecords
            : state.activeView === "seller"
                ? state.sellerRecords
                : getSharedCollectionRecords();
        return filterAndSortRecords(sourceRecords);
    }

    function getSharedCollectionRecords() {
        if (!state.isSharedView || !state.sharedRecordIds) return state.records;
        return state.records.filter((record) => state.sharedRecordIds.has(record.shareId));
    }

    function getFilteredCollectionRecords() {
        return filterAndSortRecords(getSharedCollectionRecords());
    }

    function createStatCard(label, value, detail) {
        const card = document.createElement("article");
        const cardLabel = document.createElement("p");
        const cardValue = document.createElement("strong");
        const cardDetail = document.createElement("span");
        card.className = "analytics-stat";
        cardLabel.textContent = label;
        cardValue.textContent = value;
        cardDetail.textContent = detail;
        card.append(cardLabel, cardValue, cardDetail);
        return card;
    }

    function createAnalyticsSection(title, description, className) {
        const section = document.createElement("section");
        const heading = document.createElement("div");
        const headingTitle = document.createElement("h3");
        const headingDetail = document.createElement("p");
        section.className = className;
        heading.className = "analytics-section-heading";
        headingTitle.textContent = title;
        headingDetail.textContent = description;
        heading.append(headingTitle, headingDetail);
        section.append(heading);
        return section;
    }

    function createDonutChart(title, entries, description) {
        const section = createAnalyticsSection(title, description, "analytics-visual analytics-donut-card");
        const content = document.createElement("div");
        const chart = document.createElement("div");
        const center = document.createElement("div");
        const centerValue = document.createElement("strong");
        const centerLabel = document.createElement("span");
        const legend = document.createElement("div");
        const colors = ["#e5a94f", "#d97852", "#9b7ac7", "#5c9f8b", "#7096c7"];
        const total = entries.reduce((sum, entry) => sum + entry[1], 0);
        let cursor = 0;
        const segments = entries.map((entry, index) => {
            const start = cursor;
            cursor += total ? (entry[1] / total) * 360 : 0;
            return `${colors[index]} ${start}deg ${cursor}deg`;
        });

        content.className = "donut-content";
        chart.className = "donut-chart";
        center.className = "donut-center";
        legend.className = "donut-legend";
        chart.style.background = entries.length
            ? `conic-gradient(${segments.join(", ")})`
            : "rgba(255,255,255,0.06)";
        chart.setAttribute("role", "img");
        chart.setAttribute(
            "aria-label",
            entries.length
                ? `${title}: ${entries.map(([label, count]) => `${label}, ${count}`).join("; ")}`
                : `${title}: no data available`,
        );
        centerValue.textContent = total;
        centerLabel.textContent = "albums";
        center.append(centerValue, centerLabel);
        chart.append(center);

        entries.forEach(([label, count], index) => {
            const item = document.createElement("div");
            const swatch = document.createElement("span");
            const itemLabel = document.createElement("p");
            const value = document.createElement("strong");
            item.className = "donut-legend-item";
            swatch.style.backgroundColor = colors[index];
            itemLabel.textContent = label;
            itemLabel.title = label;
            value.textContent = count;
            item.append(swatch, itemLabel, value);
            legend.append(item);
        });
        content.append(chart, legend);
        section.append(content);
        return section;
    }

    function countValues(values) {
        const counts = new Map();
        values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
        return [...counts.entries()].sort((first, second) => second[1] - first[1] || collator.compare(first[0], second[0]));
    }

    function createSvgElement(name, attributes = {}) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", name);
        Object.entries(attributes).forEach(([attribute, value]) => element.setAttribute(attribute, value));
        return element;
    }

    function createTimeline(yearEntries, sourceLabel) {
        const section = createAnalyticsSection(
            `${sourceLabel} Timeline`,
            "Album count by original release year",
            "analytics-visual analytics-timeline",
        );

        if (yearEntries.length === 0) {
            const empty = document.createElement("p");
            empty.className = "analytics-empty";
            empty.textContent = `No release-year data is available for this ${sourceLabel.toLocaleLowerCase()}.`;
            section.append(empty);
            return section;
        }

        const yearCounts = new Map(yearEntries.map(([year, count]) => [Number(year), count]));
        const firstYear = Math.min(...yearCounts.keys());
        const lastYear = Math.max(...yearCounts.keys());
        const data = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => ({
            year: firstYear + index,
            count: yearCounts.get(firstYear + index) || 0,
        }));
        const width = Math.max(760, data.length * 14);
        const height = 280;
        const margin = { top: 18, right: 22, bottom: 38, left: 44 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;
        const maxCount = Math.max(...data.map((item) => item.count), 1);
        const pointFor = (item, index) => ({
            x: margin.left + (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth),
            y: margin.top + plotHeight - (item.count / maxCount) * plotHeight,
        });
        const points = data.map(pointFor);
        const wrapper = document.createElement("div");
        const svg = createSvgElement("svg", {
            viewBox: `0 0 ${width} ${height}`,
            role: "img",
            "aria-label": `${sourceLabel} timeline from ${firstYear} to ${lastYear}`,
        });
        wrapper.className = "timeline-scroll";
        svg.classList.add("timeline-chart");

        for (let line = 0; line <= 4; line += 1) {
            const y = margin.top + (plotHeight / 4) * line;
            const value = Math.round(maxCount - (maxCount / 4) * line);
            svg.append(createSvgElement("line", {
                x1: margin.left,
                x2: width - margin.right,
                y1: y,
                y2: y,
                class: "timeline-grid-line",
            }));
            const label = createSvgElement("text", {
                x: margin.left - 9,
                y: y + 4,
                class: "timeline-axis-label timeline-y-label",
            });
            label.textContent = value;
            svg.append(label);
        }

        const area = createSvgElement("path", {
            d: `M ${points[0].x} ${margin.top + plotHeight} L ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points.at(-1).x} ${margin.top + plotHeight} Z`,
            class: "timeline-area",
        });
        const line = createSvgElement("path", {
            d: points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" "),
            class: "timeline-line",
        });
        svg.append(area, line);

        const labelInterval = Math.max(1, Math.ceil(data.length / 10));
        data.forEach((item, index) => {
            const point = points[index];
            const circle = createSvgElement("circle", {
                cx: point.x,
                cy: point.y,
                r: 3.4,
                class: "timeline-point",
            });
            const tooltip = createSvgElement("title");
            tooltip.textContent = `${item.year}: ${item.count} album${item.count === 1 ? "" : "s"}`;
            circle.append(tooltip);
            svg.append(circle);

            if (index % labelInterval === 0 || index === data.length - 1) {
                const label = createSvgElement("text", {
                    x: point.x,
                    y: height - 12,
                    class: "timeline-axis-label timeline-x-label",
                });
                label.textContent = item.year;
                svg.append(label);
            }
        });

        wrapper.append(svg);
        section.append(wrapper);
        return section;
    }

    function showDistributionRecords(filterType, value) {
        const scope = state.analyticsScope;
        state.activeView = scope;
        state.artistFilter = filterType === "artist" ? value : "";
        state.labelFilter = filterType === "label" ? value : "";
        elements.searchInput.value = value;
        updateNavigation();
        renderRecords();
        trackRum(`analytics_${filterType}_selected`, { scope });
        requestAnimationFrame(() => {
            elements.collectionControls.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    function createDistributionTable(title, itemLabel, entries, sourceLabel, filterType) {
        const itemLabelLower = itemLabel.toLocaleLowerCase();
        const section = createAnalyticsSection(
            `${title} Distribution`,
            `Top 10 ${itemLabelLower}s by albums in the ${sourceLabel.toLocaleLowerCase()}. Select one to see matching records.`,
            "analytics-visual analytics-table-card",
        );
        const wrapper = document.createElement("div");
        const table = document.createElement("table");
        const head = document.createElement("thead");
        const body = document.createElement("tbody");
        const headRow = document.createElement("tr");
        wrapper.className = "artist-table-wrap";
        table.className = "artist-table";

        ["Rank", itemLabel, "Albums"].forEach((label) => {
            const heading = document.createElement("th");
            heading.scope = "col";
            heading.textContent = label;
            headRow.append(heading);
        });
        head.append(headRow);

        entries.slice(0, 10).forEach(([nameValue, count], index) => {
            const row = document.createElement("tr");
            const rank = document.createElement("td");
            const name = document.createElement("td");
            const albums = document.createElement("td");
            const filterButton = document.createElement("button");
            rank.textContent = index + 1;
            filterButton.type = "button";
            filterButton.className = "distribution-filter-button";
            filterButton.textContent = nameValue;
            filterButton.setAttribute(
                "aria-label",
                `Show records for ${itemLabelLower} ${nameValue} in the ${sourceLabel.toLocaleLowerCase()}`,
            );
            filterButton.addEventListener("click", () => showDistributionRecords(filterType, nameValue));
            name.append(filterButton);
            albums.textContent = count;
            row.append(rank, name, albums);
            body.append(row);
        });
        table.append(head, body);
        wrapper.append(table);
        section.append(wrapper);
        return section;
    }

    function createAnalyticsScopeControl() {
        const control = document.createElement("div");
        const copy = document.createElement("div");
        const title = document.createElement("strong");
        const description = document.createElement("p");
        const buttons = document.createElement("div");
        control.className = "analytics-scope";
        buttons.className = "analytics-scope-buttons";
        buttons.setAttribute("role", "group");
        buttons.setAttribute("aria-label", "Choose records to analyze");
        title.textContent = "Analyze";
        description.textContent = "Choose which shelf these insights describe.";
        copy.append(title, description);

        [
            ["collection", state.isSharedView ? "Shared collection" : "Collection", getSharedCollectionRecords().length],
            ["wantlist", "Wantlist", state.wantlistRecords.length],
        ].forEach(([scope, label, count]) => {
            const button = document.createElement("button");
            const countBadge = document.createElement("span");
            const isActive = state.analyticsScope === scope;
            button.type = "button";
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
            button.append(document.createTextNode(label));
            countBadge.textContent = count;
            button.append(countBadge);
            button.addEventListener("click", () => {
                if (state.analyticsScope === scope) return;
                state.analyticsScope = scope;
                trackRum("analytics_scope_changed", { scope });
                renderRecords();
            });
            buttons.append(button);
        });
        control.append(copy, buttons);
        return control;
    }

    function renderAnalytics() {
        const isWantlist = state.analyticsScope === "wantlist";
        const records = isWantlist ? state.wantlistRecords : getSharedCollectionRecords();
        const sourceLabel = isWantlist ? "Wantlist" : "Collection";
        const artistEntries = countValues(records.flatMap((record) => record.artistNames?.length ? record.artistNames : [record.artist]));
        const genreEntries = countValues(records.flatMap((record) => record.genres || []));
        const labelEntries = countValues(records.map((record) => record.label));
        const yearEntries = countValues(records.map((record) => record.releaseYear ? String(record.releaseYear) : ""))
            .sort((first, second) => Number(first[0]) - Number(second[0]));
        const stats = document.createElement("div");
        const donuts = document.createElement("div");
        stats.className = "analytics-stats";
        donuts.className = "analytics-donuts";
        stats.append(
            createStatCard(
                "Total records",
                String(records.length),
                isWantlist
                    ? `@${state.profile?.username || ""}'s wantlist`
                    : state.isSharedView ? "Records in this shared collection" : `@${state.profile?.username || ""}'s collection`,
            ),
            createStatCard("Artists", String(artistEntries.length), "Unique credited artists"),
            createStatCard("Genres", String(genreEntries.length), "Unique Discogs genres"),
            createStatCard("Years", String(yearEntries.length), "Release years represented"),
        );
        donuts.append(
            createDonutChart("Top 5 Genres", genreEntries.slice(0, 5), "Most represented genres"),
            createDonutChart("Top 5 Artists", artistEntries.slice(0, 5), isWantlist ? "Most wanted artists" : "Most collected artists"),
            createDonutChart("Top 5 Labels", labelEntries.slice(0, 5), "Most represented record labels"),
        );
        elements.analyticsDashboard.replaceChildren(
            createAnalyticsScopeControl(),
            stats,
            donuts,
            createTimeline(yearEntries, sourceLabel),
            createDistributionTable("Artist", "Artist", artistEntries, sourceLabel, "artist"),
            createDistributionTable("Label", "Label", labelEntries, sourceLabel, "label"),
        );
    }

    function pluralizeRecords(count) {
        return `${count} record${count === 1 ? "" : "s"}`;
    }

    function createShareUrl(mode, selectedIds = []) {
        const url = new URL(window.location.href);
        url.pathname = url.pathname.replace(/share\/?$/, "");
        url.search = "";
        url.hash = "";
        url.searchParams.set("shared", state.profile.username);
        url.searchParams.set("mode", mode);

        if (mode === "current") {
            const query = elements.searchInput.value.trim().slice(0, MAX_SHARE_QUERY_LENGTH);
            if (query) url.searchParams.set("q", query);
            if (elements.sortSelect.value !== "shuffle") url.searchParams.set("sort", elements.sortSelect.value);
        }
        if (mode === "custom") {
            url.searchParams.set("ids", selectedIds.slice(0, MAX_SHARE_IDS).join(","));
        }
        const description = elements.shareDescription.value.trim().slice(0, MAX_SHARE_DESCRIPTION_LENGTH);
        if (description) url.searchParams.set("description", description);
        return url.toString();
    }

    async function copyText(value) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(value);
                return true;
            }
        } catch {
            // Fall through to the selection fallback.
        }
        elements.shareUrl.focus();
        elements.shareUrl.select();
        return document.execCommand("copy");
    }

    function showShareResult(url) {
        elements.shareUrl.value = url;
        elements.shareResult.hidden = false;
        elements.shareStatus.textContent = "";
        elements.shareResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
        copyText(url).then((copied) => {
            elements.shareStatus.textContent = copied
                ? "Link copied to your clipboard."
                : "Your link is ready. Select it and copy it manually.";
        });
    }

    function customShareMatches(record) {
        const query = elements.customShareSearch.value.trim().toLocaleLowerCase();
        if (!query) return true;
        return `${record.artist} ${record.title}`.toLocaleLowerCase().includes(query);
    }

    function updateCustomSelectionCount() {
        const count = state.customShareIds.size;
        elements.customSelectionCount.textContent = `${count} album${count === 1 ? "" : "s"} selected`;
        elements.createCustomShare.disabled = count === 0;
    }

    function renderCustomShareGrid() {
        const records = state.records.filter(customShareMatches);
        elements.customShareGrid.replaceChildren();
        records.forEach((record) => {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            const imageWrap = document.createElement("span");
            const copy = document.createElement("span");
            const title = document.createElement("strong");
            const artist = document.createElement("small");
            label.className = "custom-share-item";
            checkbox.type = "checkbox";
            checkbox.checked = state.customShareIds.has(record.shareId);
            imageWrap.className = "custom-share-cover";
            copy.className = "custom-share-copy";
            title.textContent = record.title;
            artist.textContent = record.artist;

            if (record.albumArt) {
                const image = document.createElement("img");
                image.src = record.albumArt;
                image.alt = "";
                image.loading = "lazy";
                image.referrerPolicy = "no-referrer";
                imageWrap.append(image);
            }
            checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                    state.customShareIds.add(record.shareId);
                } else {
                    state.customShareIds.delete(record.shareId);
                }
                label.classList.toggle("is-selected", checkbox.checked);
                updateCustomSelectionCount();
            });
            label.classList.toggle("is-selected", checkbox.checked);
            copy.append(title, artist);
            label.append(checkbox, imageWrap, copy);
            elements.customShareGrid.append(label);
        });
        updateCustomSelectionCount();
    }

    function renderSharePage() {
        const filteredRecords = getFilteredCollectionRecords();
        elements.shareCurrentCount.textContent = pluralizeRecords(filteredRecords.length);
        elements.shareFullCount.textContent = pluralizeRecords(state.records.length);
        if (!elements.customSharePanel.hidden) renderCustomShareGrid();
    }

    function parseSharedView() {
        const params = new URLSearchParams(window.location.search);
        const username = (params.get("shared") || "").trim().slice(0, MAX_USERNAME_LENGTH);
        if (!username) return null;
        const requestedMode = params.get("mode") || "full";
        const requestedSort = params.get("sort") || "shuffle";
        return {
            username,
            mode: ["current", "full", "custom"].includes(requestedMode) ? requestedMode : "full",
            query: (params.get("q") || "").slice(0, MAX_SHARE_QUERY_LENGTH),
            sort: ["shuffle", "artist", "title", "newest", "rating"].includes(requestedSort)
                ? requestedSort
                : "shuffle",
            description: (params.get("description") || "").slice(0, MAX_SHARE_DESCRIPTION_LENGTH),
            ids: new Set(
                (params.get("ids") || "")
                    .split(",")
                    .filter((id) => /^[a-z0-9_-]{1,80}$/i.test(id))
                    .slice(0, MAX_SHARE_IDS),
            ),
        };
    }

    function renderRecords() {
        const isAnalytics = state.activeView === "analytics";
        const isAbout = state.activeView === "about";
        const isShare = state.activeView === "share";
        const isSeller = state.activeView === "seller";
        elements.collectionControls.hidden = isAnalytics || isAbout || isShare;
        elements.analyticsDashboard.hidden = !isAnalytics;
        elements.aboutPage.hidden = !isAbout;
        elements.sharePage.hidden = !isShare;
        elements.cardContainer.hidden = true;
        elements.statusMessage.hidden = true;
        elements.sellerPagination.hidden = true;
        const showsSharedCollection = state.activeView === "collection"
            || (state.activeView === "analytics" && state.analyticsScope === "collection");
        elements.sharedBanner.hidden = !(state.isSharedView && showsSharedCollection);
        elements.sharedDescription.textContent = state.sharedDescription || "A collection shared from Vinyl Viewer.";

        if (isAnalytics) {
            const isWantlistAnalytics = state.analyticsScope === "wantlist";
            const analyticsRecords = isWantlistAnalytics ? state.wantlistRecords : getSharedCollectionRecords();
            elements.sectionEyebrow.textContent = isWantlistAnalytics
                ? "Wantlist insights"
                : state.isSharedView ? "Shared collection insights" : "Collection insights";
            elements.collectionHeading.textContent = isWantlistAnalytics
                ? "Wantlist analytics"
                : state.isSharedView ? "Shared collection analytics" : "Collection analytics";
            elements.resultCount.textContent = `${analyticsRecords.length} records analyzed`;
            renderAnalytics();
            return;
        }

        if (isAbout) {
            elements.sectionEyebrow.textContent = "About the project";
            elements.collectionHeading.textContent = "Who built this?";
            elements.resultCount.textContent = "";
            return;
        }

        if (isShare) {
            elements.sectionEyebrow.textContent = "Send the shelf";
            elements.collectionHeading.textContent = "Share collection";
            elements.resultCount.textContent = "";
            renderSharePage();
            return;
        }

        const isWantlist = state.activeView === "wantlist";
        elements.searchInput.placeholder = isSeller
            ? "Search this page of seller listings"
            : "Search artist, album, or label";
        elements.sectionEyebrow.textContent = isSeller
            ? "Experimental marketplace browser"
            : isWantlist ? "Wanted records" : "Record library";
        elements.collectionHeading.textContent = isSeller
            ? `@${state.profile?.username || "User"}'s records for sale`
            : isWantlist
                ? `${state.profile?.username || "User"}'s wantlist`
                : state.isSharedView
                    ? `${state.profile?.username || "User"}'s shared collection`
                    : "Browse the collection";

        if (isSeller && state.sellerLoading) {
            const loader = document.createElement("div");
            const message = document.createElement("p");
            loader.className = "loader";
            message.textContent = "Loading one page of seller inventory from Discogs…";
            elements.statusMessage.replaceChildren(loader, message);
            elements.statusMessage.hidden = false;
            elements.resultCount.textContent = "Fetching 50 listings…";
            return;
        }

        if (isSeller && state.sellerError) {
            const heading = document.createElement("h3");
            const message = document.createElement("p");
            heading.textContent = "Seller inventory unavailable";
            message.textContent = state.sellerError;
            elements.statusMessage.replaceChildren(heading, message);
            elements.statusMessage.hidden = false;
            elements.resultCount.textContent = "";
            return;
        }

        const visibleRecords = getVisibleRecords();
        elements.cardContainer.replaceChildren();

        visibleRecords.forEach(renderCard);

        const total = isSeller
            ? state.sellerInventoryTotal || 0
            : isWantlist
            ? state.wantlistRecords.length
            : getSharedCollectionRecords().length;
        elements.resultCount.textContent = isSeller
            ? `${visibleRecords.length} shown · ${total.toLocaleString()} active listings`
            : visibleRecords.length === total
            ? `${total} records`
            : `${visibleRecords.length} of ${total} records`;

        if (isSeller && state.sellerInventoryPage > 0) {
            elements.sellerPageStatus.textContent = `Page ${state.sellerInventoryPage.toLocaleString()} of ${state.sellerInventoryPages.toLocaleString()}`;
            elements.sellerPrevious.disabled = state.sellerInventoryPage <= 1;
            elements.sellerNext.disabled = state.sellerInventoryPage >= state.sellerInventoryPages;
            elements.sellerProfileLink.href = `https://www.discogs.com/seller/${encodeURIComponent(state.profile.username)}/profile`;
            elements.sellerPagination.hidden = false;
        }

        elements.statusMessage.replaceChildren();
        if (visibleRecords.length === 0) {
            const heading = document.createElement("h3");
            const message = document.createElement("p");
            heading.textContent = isSeller && state.sellerInventoryTotal === 0
                ? "No active listings"
                : isWantlist && state.wantlistRecords.length === 0 ? "This wantlist is empty" : "No records found";
            message.textContent = isSeller && state.sellerInventoryTotal === 0
                ? "This user does not currently have anything listed for sale."
                : isWantlist && state.wantlistRecords.length === 0
                ? "This user has no public wantlist items."
                : isSeller ? "Try another search on this inventory page." : "Try another search.";
            elements.statusMessage.append(heading, message);
            elements.statusMessage.hidden = false;
            elements.cardContainer.hidden = true;
        } else {
            elements.statusMessage.hidden = true;
            elements.cardContainer.hidden = false;
        }
    }

    function spotifyAlbumId(url) {
        if (!url) return "";
        try {
            const parsedUrl = new URL(url);
            const parts = parsedUrl.pathname.split("/").filter(Boolean);
            return parts[0] === "album" ? parts[1] || "" : "";
        } catch {
            return "";
        }
    }

    function addDetail(list, label, value) {
        if (!value) return;
        const wrapper = document.createElement("div");
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        wrapper.append(term, description);
        list.append(wrapper);
    }

    function createExternalLink(label, href, className) {
        const link = document.createElement("a");
        link.className = `external-link ${className}`;
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.referrerPolicy = "no-referrer";
        link.textContent = label;
        return link;
    }

    function tracklistDuration(tracklist) {
        const seconds = tracklist.reduce((total, track) => {
            if (!track.duration) return total;
            const parts = track.duration.split(":").map(Number);
            if (parts.some(Number.isNaN)) return total;
            if (parts.length === 2) return total + parts[0] * 60 + parts[1];
            if (parts.length === 3) return total + parts[0] * 3600 + parts[1] * 60 + parts[2];
            return total;
        }, 0);
        if (!seconds) return "";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return hours
            ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
            : `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
    }

    function createTracklistSection(releaseDetails, isLoading, loadError) {
        const section = document.createElement("section");
        const heading = document.createElement("div");
        const title = document.createElement("h3");
        section.className = "modal-tracklist";
        heading.className = "tracklist-heading";
        title.textContent = "Track Listing";
        heading.append(title);
        section.append(heading);

        if (isLoading) {
            const loading = document.createElement("div");
            const loader = document.createElement("div");
            const message = document.createElement("p");
            loading.className = "tracklist-status";
            loader.className = "loader";
            message.textContent = "Loading release details from Discogs…";
            loading.append(loader, message);
            section.append(loading);
            return section;
        }

        const tracklist = releaseDetails?.tracklist || [];
        if (loadError || tracklist.length === 0) {
            const message = document.createElement("p");
            message.className = "tracklist-status";
            message.textContent = loadError || "No track listing is available for this release.";
            section.append(message);
            return section;
        }

        const summary = document.createElement("p");
        const totalDuration = tracklistDuration(tracklist);
        summary.textContent = `${tracklist.length} track${tracklist.length === 1 ? "" : "s"}${totalDuration ? ` · ${totalDuration} total` : ""}`;
        heading.append(summary);

        const list = document.createElement("ol");
        list.className = "track-list";
        tracklist.forEach((track, index) => {
            const item = document.createElement("li");
            const position = document.createElement("span");
            const trackTitle = document.createElement("strong");
            const duration = document.createElement("span");
            position.textContent = track.position || String(index + 1);
            trackTitle.textContent = track.title || "Untitled track";
            duration.textContent = track.duration || "";
            item.append(position, trackTitle, duration);
            list.append(item);
        });
        section.append(list);

        if (releaseDetails.notes) {
            const notes = document.createElement("details");
            const notesHeading = document.createElement("summary");
            const notesCopy = document.createElement("p");
            notesHeading.textContent = "Release notes";
            notesCopy.textContent = releaseDetails.notes;
            notes.append(notesHeading, notesCopy);
            section.append(notes);
        }
        return section;
    }

    function artistPageUrl(artist) {
        if (!artist?.id) return "";
        return `https://www.discogs.com/artist/${encodeURIComponent(artist.id)}`;
    }

    function siteLabel(value) {
        try {
            return new URL(value).hostname.replace(/^www\./, "");
        } catch {
            return value;
        }
    }

    function createArtistMetadataSection(artistDetails, isLoading = false) {
        const section = document.createElement("section");
        section.className = "artist-metadata";

        if (isLoading) {
            const status = document.createElement("p");
            status.className = "artist-metadata-status";
            status.textContent = "Loading artist sites and group memberships…";
            section.append(status);
            return section;
        }

        const sites = [];
        const groups = [];
        const seenSites = new Set();
        const seenGroups = new Set();
        artistDetails.forEach((artist) => {
            (artist.urls || []).forEach((url) => {
                if (!isSafeExternalUrl(url) || seenSites.has(url)) return;
                seenSites.add(url);
                sites.push({ name: siteLabel(url), url });
            });
            (artist.groups || []).forEach((group) => {
                const url = artistPageUrl(group);
                const key = `${group.id || ""}-${group.name || ""}`;
                if (!url || !group.name || seenGroups.has(key)) return;
                seenGroups.add(key);
                groups.push({ name: group.name, url });
            });
        });

        [["Sites", sites], ["In Groups", groups]].forEach(([label, items]) => {
            if (items.length === 0) return;
            const row = document.createElement("div");
            const heading = document.createElement("h3");
            const links = document.createElement("div");
            heading.textContent = label;
            links.className = "artist-metadata-links";
            items.forEach((item) => {
                const link = document.createElement("a");
                link.href = item.url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.referrerPolicy = "no-referrer";
                link.textContent = item.name;
                links.append(link);
            });
            row.append(heading, links);
            section.append(row);
        });
        return section;
    }

    async function loadReleaseArtists(releaseDetails) {
        const artistIds = [...new Set(
            (releaseDetails?.artists || []).map((artist) => artist.id).filter(Boolean),
        )];
        const responses = await Promise.allSettled(
            artistIds.map(async (artistId) => {
                if (state.artistMetadata.has(artistId)) return state.artistMetadata.get(artistId);
                const artist = await fetchDiscogs(`/artists/${encodeURIComponent(artistId)}`);
                state.artistMetadata.set(artistId, artist);
                return artist;
            }),
        );
        return responses
            .filter((response) => response.status === "fulfilled")
            .map((response) => response.value);
    }

    function relatedAlbums(record) {
        const targetArtists = new Set(
            (record.artistNames?.length ? record.artistNames : [record.artist])
                .map((name) => name.trim().toLocaleLowerCase())
                .filter(Boolean),
        );
        const seenReleases = new Set([record.id]);
        return [...state.records, ...state.wantlistRecords, ...state.sellerRecords]
            .filter((candidate) => {
                if (seenReleases.has(candidate.id)) return false;
                const candidateArtists = candidate.artistNames?.length ? candidate.artistNames : [candidate.artist];
                const matches = candidateArtists.some((name) => targetArtists.has(name.trim().toLocaleLowerCase()));
                if (matches) seenReleases.add(candidate.id);
                return matches;
            })
            .slice(0, 10);
    }

    function createRelatedAlbumsSection(record) {
        const albums = relatedAlbums(record);
        if (albums.length === 0) return null;

        const section = document.createElement("section");
        const heading = document.createElement("div");
        const title = document.createElement("h3");
        const count = document.createElement("p");
        const grid = document.createElement("div");
        section.className = "related-albums";
        heading.className = "related-albums-heading";
        grid.className = "related-albums-grid";
        title.textContent = "More by this artist";
        count.textContent = `${albums.length} other album${albums.length === 1 ? "" : "s"} loaded`;
        heading.append(title, count);

        albums.forEach((album) => {
            const button = document.createElement("button");
            const cover = document.createElement("span");
            const copy = document.createElement("span");
            const albumTitle = document.createElement("strong");
            const source = document.createElement("small");
            button.type = "button";
            button.className = "related-album-button";
            button.setAttribute("aria-label", `View ${album.title} by ${album.artist}`);
            cover.className = "related-album-cover";
            copy.className = "related-album-copy";
            albumTitle.textContent = album.title;
            source.textContent = album.collection;

            if (album.albumArt) {
                const image = document.createElement("img");
                image.src = album.albumArt;
                image.alt = "";
                image.loading = "lazy";
                image.referrerPolicy = "no-referrer";
                image.addEventListener("error", () => image.remove(), { once: true });
                cover.append(image);
            }
            button.addEventListener("click", () => openModal(album));
            copy.append(albumTitle, source);
            button.append(cover, copy);
            grid.append(button);
        });
        section.append(heading, grid);
        return section;
    }

    function buildModalContent(
        record,
        releaseDetails = null,
        isLoading = false,
        loadError = "",
        artistDetails = [],
        isArtistMetadataLoading = false,
    ) {
        const layout = document.createElement("div");
        const media = document.createElement("div");
        const details = document.createElement("div");
        const imageWrap = document.createElement("div");
        const headingGroup = document.createElement("div");
        const eyebrow = document.createElement("p");
        const title = document.createElement("h2");
        const artist = document.createElement("p");
        const detailList = document.createElement("dl");
        const links = document.createElement("div");

        layout.className = "modal-layout";
        media.className = "modal-media";
        details.className = "modal-details";
        imageWrap.className = "modal-cover";
        headingGroup.className = "modal-heading";
        eyebrow.className = "eyebrow";
        artist.className = "modal-artist";
        links.className = "external-links";

        eyebrow.textContent = record.collection;
        title.id = "modal-title";
        title.textContent = record.title;
        artist.textContent = record.artist;

        if (record.albumArt) {
            const image = document.createElement("img");
            image.src = record.albumArt;
            image.alt = `Cover of ${record.title} by ${record.artist}`;
            image.referrerPolicy = "no-referrer";
            image.addEventListener("error", () => imageWrap.classList.add("image-error"), { once: true });
            imageWrap.append(image);
        } else {
            imageWrap.classList.add("image-error");
        }
        const fallback = document.createElement("div");
        fallback.className = "modal-cover-fallback";
        fallback.innerHTML = "<span></span><p>Artwork unavailable</p>";
        imageWrap.append(fallback);

        addDetail(detailList, "Label", record.label);
        addDetail(detailList, "Format", record.format);
        addDetail(detailList, "Catalog number", record.catalogNumber);
        addDetail(detailList, "Released", releaseDetails?.released_formatted || record.releaseYear);
        addDetail(detailList, "Country", releaseDetails?.country);
        addDetail(detailList, "Date added", formatDate(record.dateAdded));
        addDetail(detailList, "Rating", record.rating ? `${record.rating} out of 5` : "");
        addDetail(detailList, "Price", record.sellerPrice);
        addDetail(detailList, "Media condition", record.mediaCondition);
        addDetail(detailList, "Sleeve condition", record.sleeveCondition);
        addDetail(detailList, "Ships from", record.shipsFrom);

        if (record.listingUrl) {
            links.append(createExternalLink("View seller listing", record.listingUrl, "listing-link"));
        }
        if (!record.spotifyUrl) {
            const spotifySearch = `https://open.spotify.com/search/${encodeURIComponent(`${record.artist} ${record.title}`)}`;
            links.append(createExternalLink("Search Spotify", spotifySearch, "spotify-search-link"));
        }
        links.append(createExternalLink("View on Discogs", `https://www.discogs.com/release/${encodeURIComponent(record.id)}`, "discogs-link"));
        links.append(createExternalLink("Find for sale", `https://www.discogs.com/sell/release/${encodeURIComponent(record.id)}`, "marketplace-link"));
        if (record.discogsArtistUrl) {
            links.append(createExternalLink("View artist", record.discogsArtistUrl, "artist-link"));
        }

        headingGroup.append(eyebrow, title, artist);
        details.append(headingGroup, detailList);

        if (record.low || record.median || record.high) {
            const market = document.createElement("section");
            const marketHeading = document.createElement("h3");
            const values = document.createElement("div");
            market.className = "market-values";
            marketHeading.textContent = "Marketplace range";
            values.className = "market-grid";
            [["Low", record.low], ["Median", record.median], ["High", record.high]].forEach(([label, value]) => {
                if (!value) return;
                const item = document.createElement("div");
                const itemLabel = document.createElement("span");
                const itemValue = document.createElement("strong");
                itemLabel.textContent = label;
                itemValue.textContent = value;
                item.append(itemLabel, itemValue);
                values.append(item);
            });
            market.append(marketHeading, values);
            details.append(market);
        }

        details.append(links);

        const albumId = spotifyAlbumId(record.spotifyUrl);
        if (albumId) {
            const player = document.createElement("iframe");
            player.className = "spotify-player";
            player.src = `https://open.spotify.com/embed/album/${encodeURIComponent(albumId)}?utm_source=generator`;
            player.title = `Listen to ${record.title} on Spotify`;
            player.loading = "lazy";
            player.referrerPolicy = "no-referrer";
            player.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
            media.append(imageWrap, player);
        } else {
            media.append(imageWrap);
        }

        layout.append(media, details);
        const artistMetadata = createArtistMetadataSection(artistDetails, isArtistMetadataLoading);
        const relatedSection = createRelatedAlbumsSection(record);
        if (relatedSection) layout.append(relatedSection);
        layout.append(createTracklistSection(releaseDetails, isLoading, loadError));
        if (artistMetadata.childElementCount > 0) layout.append(artistMetadata);
        return layout;
    }

    async function openModal(record) {
        const requestId = ++state.modalRequestId;
        trackRum("album_modal_opened", { collection_type: record.source || state.activeView });
        if (elements.modal.hidden) state.lastFocusedElement = document.activeElement;
        elements.modalContent.replaceChildren(buildModalContent(record, null, true));
        elements.modal.hidden = false;
        elements.modalDialog.scrollTop = 0;
        document.body.classList.add("modal-open");
        requestAnimationFrame(() => elements.modalDialog.focus());

        try {
            const releaseDetails = await fetchDiscogs(`/releases/${encodeURIComponent(record.id)}`);
            if (requestId !== state.modalRequestId || elements.modal.hidden) return;
            const hasArtists = (releaseDetails.artists || []).some((artist) => artist.id);
            elements.modalContent.replaceChildren(
                buildModalContent(record, releaseDetails, false, "", [], hasArtists),
            );
            if (!hasArtists) return;
            const artistDetails = await loadReleaseArtists(releaseDetails);
            if (requestId !== state.modalRequestId || elements.modal.hidden) return;
            const artistMetadata = createArtistMetadataSection(artistDetails);
            const currentMetadata = elements.modalContent.querySelector(".artist-metadata");
            if (artistMetadata.childElementCount > 0) {
                currentMetadata?.replaceWith(artistMetadata);
            } else {
                currentMetadata?.remove();
            }
        } catch (error) {
            console.error("Unable to load release details:", error);
            reportRumError("Discogs release details request failed", error, { operation: "release_details" });
            if (requestId !== state.modalRequestId || elements.modal.hidden) return;
            elements.modalContent.replaceChildren(
                buildModalContent(record, null, false, "Release details could not be loaded from Discogs."),
            );
        }
    }

    function closeModal() {
        if (elements.modal.hidden) return;
        state.modalRequestId += 1;
        elements.modal.hidden = true;
        elements.modalContent.replaceChildren();
        document.body.classList.remove("modal-open");
        state.lastFocusedElement?.focus();
    }

    function trapModalFocus(event) {
        if (event.key === "Escape") {
            closeModal();
            return;
        }
        if (event.key !== "Tab") return;

        const focusable = [...elements.modalDialog.querySelectorAll("button, a[href], iframe, [tabindex]:not([tabindex='-1'])")];
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && (document.activeElement === first || document.activeElement === elements.modalDialog)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === elements.modalDialog) {
            event.preventDefault();
            first.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function showConnectionScreen(errorMessage = "") {
        elements.navigationRow.hidden = true;
        elements.collectionPanel.hidden = true;
        elements.connectionScreen.hidden = false;
        elements.connectionError.textContent = errorMessage;
        elements.connectionError.hidden = !errorMessage;
        elements.connectButton.disabled = false;
        elements.connectButton.textContent = "View collection";
        requestAnimationFrame(() => elements.usernameInput.focus());
    }

    function showConnecting(username) {
        elements.connectionScreen.hidden = true;
        elements.navigationRow.hidden = true;
        elements.collectionPanel.hidden = false;
        elements.collectionControls.hidden = true;
        elements.analyticsDashboard.hidden = true;
        elements.cardContainer.hidden = true;
        elements.sectionEyebrow.textContent = "Connecting to Discogs";
        elements.collectionHeading.textContent = `Loading @${username}`;
        elements.resultCount.textContent = "Fetching public records…";
        const loader = document.createElement("div");
        const message = document.createElement("p");
        loader.className = "loader";
        message.textContent = "Pulling the collection and wantlist from Discogs…";
        elements.statusMessage.replaceChildren(loader, message);
        elements.statusMessage.hidden = false;
    }

    function showConnected() {
        elements.connectionScreen.hidden = true;
        elements.collectionPanel.hidden = false;
        elements.navigationRow.hidden = false;
        elements.connectedUsername.textContent = `@${state.profile.username}`;
        elements.searchInput.value = "";
        elements.sortSelect.value = "shuffle";
        state.artistFilter = "";
        state.labelFilter = "";
        state.sharedRecordIds = null;
        state.sharedDescription = "";
        state.isSharedView = false;

        if (state.pendingShare) {
            const shared = state.pendingShare;
            state.isSharedView = true;
            state.sharedDescription = shared.description;
            if (shared.mode === "current") {
                elements.searchInput.value = shared.query;
                elements.sortSelect.value = [...elements.sortSelect.options]
                    .some((option) => option.value === shared.sort) ? shared.sort : "shuffle";
                if (shared.query) {
                    state.sharedRecordIds = new Set(
                        state.records
                            .filter((record) => recordMatchesQuery(record, shared.query))
                            .map((record) => record.shareId),
                    );
                }
            } else if (shared.mode === "custom") {
                state.sharedRecordIds = shared.ids;
            }
            state.pendingShare = null;
            state.activeView = "collection";
        } else {
            state.activeView = new URLSearchParams(window.location.search).get("view") === "share"
                ? "share"
                : "collection";
        }
        updateNavigation();
        renderRecords();
    }

    async function connect(username) {
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            showConnectionScreen("Enter a Discogs username.");
            return;
        }

        showConnecting(trimmedUsername);
        try {
            const data = await loadDiscogsUser(trimmedUsername);
            await localMetadataPromise;
            state.profile = data.profile;
            state.records = data.records;
            state.wantlistRecords = data.wantlistRecords;
            enrichWithLocalMetadata(state.records);
            enrichWithLocalMetadata(state.wantlistRecords);
            shuffle(state.records);
            localStorage.setItem("vinyl-viewer-username", state.profile.username);
            showConnected();
            trackRum("discogs_collection_loaded", {
                collection_count: state.records.length,
                wantlist_count: state.wantlistRecords.length,
                shared_view: state.isSharedView,
            });
        } catch (error) {
            console.error("Unable to connect to Discogs:", error);
            reportRumError("Discogs collection request failed", error, { operation: "collection" });
            const message = error.status === 404
                ? `Discogs user “${trimmedUsername}” was not found.`
                : error.status === 403
                    ? `@${trimmedUsername}'s collection or wantlist is private.`
                    : error.status === 429
                        ? "Discogs is rate limiting requests. Wait one minute and try again."
                        : error instanceof TypeError
                            ? "Discogs temporarily blocked the browser request. Wait one minute and try again."
                            : "Discogs could not be reached. Check the username and try again.";
            elements.usernameInput.value = trimmedUsername;
            showConnectionScreen(message);
        }
    }

    function disconnect() {
        localStorage.removeItem("vinyl-viewer-username");
        state.activeView = "collection";
        state.analyticsScope = "collection";
        state.artistFilter = "";
        state.labelFilter = "";
        state.profile = null;
        state.records = [];
        state.customShareIds = new Set();
        state.isSharedView = false;
        state.sharedDescription = "";
        state.sharedRecordIds = null;
        state.sellerError = "";
        state.sellerInventoryPage = 0;
        state.sellerInventoryPages = 0;
        state.sellerInventoryTotal = null;
        state.sellerLoading = false;
        state.sellerRecords = [];
        state.wantlistRecords = [];
        state.shuffleOrder = new Map();
        elements.cardContainer.replaceChildren();
        elements.analyticsDashboard.replaceChildren();
        elements.usernameInput.value = "";
        showConnectionScreen();
        trackRum("discogs_user_disconnected");
    }

    function clearSharedView() {
        if (!state.isSharedView) return;
        state.isSharedView = false;
        state.sharedDescription = "";
        state.sharedRecordIds = null;
        state.pendingShare = null;
        state.artistFilter = "";
        state.labelFilter = "";
        elements.searchInput.value = "";
        elements.sortSelect.value = "shuffle";

        const url = new URL(window.location.href);
        ["shared", "mode", "q", "sort", "description", "ids"].forEach((parameter) => {
            url.searchParams.delete(parameter);
        });
        window.history.replaceState({}, "", url);
        updateNavigation();
        renderRecords();
        trackRum("shared_view_cleared");
    }

    elements.searchInput.addEventListener("input", () => {
        state.artistFilter = "";
        state.labelFilter = "";
        renderRecords();
    });
    elements.sortSelect.addEventListener("change", renderRecords);
    elements.shuffleButton.addEventListener("click", () => {
        shuffle(state.activeView === "seller" ? state.sellerRecords : state.records);
        elements.sortSelect.value = "shuffle";
        renderRecords();
    });
    elements.viewButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const nextView = button.dataset.view;
            if (["collection", "wantlist"].includes(nextView)) state.analyticsScope = nextView;
            state.activeView = nextView;
            trackRum("app_view_changed", { view: state.activeView });
            updateNavigation();
            renderRecords();
            if (state.activeView === "seller" && state.sellerInventoryPage === 0) {
                elements.searchInput.value = "";
                loadSellerInventoryPage(1);
            }
        });
    });
    elements.sellerPrevious.addEventListener("click", () => {
        elements.searchInput.value = "";
        loadSellerInventoryPage(Math.max(1, state.sellerInventoryPage - 1));
    });
    elements.sellerNext.addEventListener("click", () => {
        elements.searchInput.value = "";
        loadSellerInventoryPage(Math.min(state.sellerInventoryPages, state.sellerInventoryPage + 1));
    });
    elements.shareCurrentButton.addEventListener("click", () => {
        trackRum("share_link_created", { mode: "filtered" });
        showShareResult(createShareUrl("current"));
    });
    elements.shareFullButton.addEventListener("click", () => {
        trackRum("share_link_created", { mode: "full" });
        showShareResult(createShareUrl("full"));
    });
    elements.shareCustomButton.addEventListener("click", () => {
        elements.customSharePanel.hidden = false;
        renderCustomShareGrid();
        elements.customSharePanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    elements.customShareSearch.addEventListener("input", renderCustomShareGrid);
    elements.selectAllShare.addEventListener("click", () => {
        state.records.filter(customShareMatches).forEach((record) => state.customShareIds.add(record.shareId));
        renderCustomShareGrid();
    });
    elements.clearShareSelection.addEventListener("click", () => {
        state.customShareIds.clear();
        renderCustomShareGrid();
    });
    elements.createCustomShare.addEventListener("click", () => {
        trackRum("share_link_created", { mode: "custom", album_count: state.customShareIds.size });
        showShareResult(createShareUrl("custom", [...state.customShareIds]));
    });
    elements.copyShareUrl.addEventListener("click", () => {
        copyText(elements.shareUrl.value).then((copied) => {
            elements.shareStatus.textContent = copied ? "Link copied to your clipboard." : "Select the link and copy it manually.";
        });
    });
    elements.connectionForm.addEventListener("submit", (event) => {
        event.preventDefault();
        elements.connectButton.disabled = true;
        elements.connectButton.textContent = "Connecting…";
        connect(elements.usernameInput.value);
    });
    elements.disconnectButton.addEventListener("click", disconnect);
    elements.clearSharedView.addEventListener("click", clearSharedView);
    elements.supportButtons.forEach((button) => {
        button.addEventListener("click", () => {
            trackRum("developer_support_clicked", {
                support_tier: button.dataset.supportTier,
                amount_usd: button.dataset.supportTier === "coffee" ? 5 : 10,
            });
        });
    });
    elements.closeModal.addEventListener("click", closeModal);
    elements.modal.addEventListener("click", (event) => {
        if (event.target.hasAttribute("data-close-modal")) closeModal();
    });
    elements.modal.addEventListener("keydown", trapModalFocus);

    state.pendingShare = parseSharedView();
    elements.sellerViewButton.hidden = !sellerFeatureEnabled;
    const savedUsername = state.pendingShare?.username
        || localStorage.getItem("vinyl-viewer-username")
        || DEFAULT_USERNAME;
    elements.usernameInput.value = savedUsername;
    connect(savedUsername);
});
