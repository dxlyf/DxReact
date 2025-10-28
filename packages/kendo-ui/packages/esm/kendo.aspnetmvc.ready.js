const __meta__ = {
    id: "aspnetmvc.ready",
    name: "AspNetMvcReady",
    category: "wrappers",
    description: "ASP.NET MVC/Core script that ensures kendo scripts/modules are ready before widget initialization.",
    depends: []
};

window.kendo.SYNCREADY_EVENT = "kendo:aspnetmvc:syncready";

window.kendo.syncReady = window.kendo?.syncReady || function(cb) {
    window.addEventListener(window.kendo.SYNCREADY_EVENT, cb, { once: true });
};

export { __meta__ };
