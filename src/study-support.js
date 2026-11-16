'use strict';
/* Shared, local-file-safe appreciation entry. No tracking or payment state. */
(() => {
 if (document.getElementById('studySupportTrigger')) return;
 const trigger = document.createElement('button');
 trigger.id = 'studySupportTrigger';
 trigger.className = 'study-support-trigger';
 trigger.type = 'button';
 trigger.setAttribute('aria-label', '请魔盒半开喝一杯咖啡');
 trigger.setAttribute('aria-haspopup', 'dialog');
 trigger.setAttribute('aria-controls', 'studySupportDialog');
 trigger.innerHTML = '<img src="assets/support/coin-mohe-v1.webp" width="28" height="28" alt=""><span class="support-sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="support-tooltip">请我喝一杯咖啡吗？</span>';
 document.body.append(trigger);
 let dialog;
 function createDialog() {
  const panel = document.createElement('dialog');
  panel.id = 'studySupportDialog';
  panel.className = 'study-dialog study-support-dialog';
  panel.setAttribute('aria-labelledby', 'studySupportTitle');
  panel.setAttribute('aria-describedby', 'studySupportMessage');
  panel.innerHTML = `
   <div class="support-topline"><span>魔盒半开</span><button type="button" class="study-dialog-close support-close" aria-label="关闭赞赏卡">×</button></div>
   <div class="support-content">
    <img class="support-illustration" src="assets/support/coffee-study-v1.webp" width="720" height="304" alt="一杯热咖啡，陪着叠在一旁的复习笔记">
    <h2 id="studySupportTitle">请我喝一杯咖啡吗？</h2>
    <p id="studySupportMessage">创作不易，谢谢你的支持。考研加油！</p>
    <div class="support-code-paper">
     <div class="support-code-crop" role="img" aria-label="魔盒半开的微信赞赏码">
      <img class="support-code-original" src="assets/support/wechat-appreciation-original.jpg" width="1152" height="1152" alt="">
      <img class="support-code-avatar" src="assets/support/mohe-avatar-384.webp" width="186" height="186" alt="">
     </div>
     <span>魔盒半开 · 微信赞赏</span>
    </div>
    <p class="support-scan-hint">微信扫一扫 · 也可截图识别</p>
   </div>`;
  document.body.append(panel);
  panel.querySelector('.support-close').addEventListener('click', () => panel.close());
  panel.addEventListener('close', () => {
   updateVisibility();
   trigger.focus({ preventScroll: true });
  });
  panel.addEventListener('click', event => {
   if (event.target !== panel) return;
   const r = panel.getBoundingClientRect();
   if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) panel.close();
  });
  return panel;
 }
 trigger.addEventListener('click', () => {
  if (!dialog) dialog = createDialog();
  if (dialog.open) return;
  document.querySelector('audio')?.pause();
  document.dispatchEvent(new CustomEvent('study:dialogopen'));
  dialog.showModal();
  dialog.querySelector('.support-content').scrollTop = 0;
  updateVisibility();
  dialog.querySelector('.support-close').focus({ preventScroll: true });
 });

 function updateVisibility() {
  // Position is identical across pages; only overlays temporarily hide the coin.
  trigger.hidden = !!document.querySelector('dialog[open], #sand:not([hidden]), .contents.mobile-open');
 }
 document.addEventListener('visibilitychange', () => trigger.classList.toggle('is-resting', document.hidden));
 // Watch only overlay attributes, never the animated map or frequently changing counters.
 const observer = new MutationObserver(updateVisibility);
 observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
 function watchOverlays() {
  document.querySelectorAll('dialog, #sand, #side, #contents, .lecture-app').forEach(el => observer.observe(el, { attributes: true, attributeFilter: ['open', 'hidden', 'data-open', 'class'] }));
 }
 const additions = new MutationObserver(() => { watchOverlays(); updateVisibility(); });
 additions.observe(document.body, { childList: true });
 watchOverlays();
 updateVisibility();
})();
