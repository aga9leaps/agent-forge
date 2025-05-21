const { Service } = await import("node-windows").then(
  (mod) => mod.default || mod
);

const svc = new Service({
  name: "Tally Reports Service",
  description: "Automated Tally report generation service",
  script: "cron_scheduler.js",
  nodeOptions: ["--harmony", "--max_old_space_size=4096"],
});

if (process.argv.includes("--install")) {
  svc.on("install", () => {
    svc.start();
    console.log("Service installed and started");
  });
  svc.install();
} else if (process.argv.includes("--uninstall")) {
  svc.on("uninstall", () => {
    console.log("Service uninstalled");
  });
  svc.uninstall();
} else {
  console.log("Usage: node service.js --install | --uninstall");
}
