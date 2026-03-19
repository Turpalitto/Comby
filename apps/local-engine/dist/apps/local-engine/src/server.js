import { createApp } from "./app";
async function start() {
    const app = createApp();
    await app.listen({
        host: "127.0.0.1",
        port: 4040
    });
}
start().catch((error) => {
    console.error(error);
    process.exit(1);
});
