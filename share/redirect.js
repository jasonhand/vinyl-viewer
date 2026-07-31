const destination = new URL("../", window.location.href);
const sourceParams = new URLSearchParams(window.location.search);
sourceParams.set("view", "share");
destination.search = sourceParams.toString();
window.location.replace(destination);
