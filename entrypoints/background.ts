export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });
});

function deesNuts() {
  console.log("deesNuts");
}
