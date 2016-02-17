export function dateClicker(elementId) {
  document.getElementById(elementId).addEventListener('click', (event) => {
    console.log(`clicked on ${event.target}`);
    event.target.text = new Date();
  });
}
