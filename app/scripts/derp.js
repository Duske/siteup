export function dateClicker(elementId) {
  document.getElementById(elementId).addEventListener('click', (event) => {
    console.log('clicked!');
    event.target.text = new Date();
  });
}
