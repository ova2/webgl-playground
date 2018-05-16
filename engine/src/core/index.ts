/**
 * Hello function.
 * @returns Hello string
 */
const hello = () => {
  return 'Hello WebGL!';
};

const main = document.getElementById('js-main');
if (main) {
  main.textContent = hello();
}
