// Countdown to the first day of the wedding weekend (midnight Mountain Time, UTC-6 in August).
(function () {
  var el = document.getElementById('days');
  if (!el) return;
  var target = new Date('2027-08-06T00:00:00-06:00').getTime();
  var days = Math.ceil((target - Date.now()) / 86400000);
  var label = el.parentElement;
  if (days > 1) { el.textContent = days; }
  else if (days === 1) { el.textContent = '1'; label.lastElementChild.textContent = 'day to go'; }
  else { label.textContent = 'See you in the mountains.'; }
})();
