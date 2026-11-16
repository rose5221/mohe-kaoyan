'use strict';
/* One resource panel for the lecture, timeline and meeting comparison. */
(() => {
 const dialog = document.createElement('dialog');
 dialog.id = 'atlasModal';
 dialog.className = 'study-dialog study-resources';
 dialog.setAttribute('aria-labelledby', 'atlasTitle');
 dialog.innerHTML = `
  <div class="study-dialog-head">
   <h2 id="atlasTitle">配套图册</h2>
   <button id="atlasClose" type="button" class="study-dialog-close" aria-label="关闭配套图册">×</button>
  </div>
  <div class="study-dialog-body">
   <div class="resource-book">
    <img class="resource-cover" loading="lazy" src="assets/community/atlas-cover.jpg" width="420" height="594" alt="山河纪年图册封面">
    <div class="resource-description">
     <h3>山河纪年</h3>
     <p class="resource-subtitle">考研政治时间轴图册</p>
     <p class="resource-meta"><span>67 页</span><span>PDF</span><span>13.5 MB</span></p>
     <p>地图、时间轴与易混点，保存后离线复习。</p>
     <span class="resource-version">v6.1 校订版</span>
    </div>
   </div>
   <div class="resource-author">
    <div class="resource-follow">
     <h3>关注作者，跟进图册修订</h3>
     <p>关注 <strong>魔盒半开</strong>，查看后续修订和工具使用演示。</p>
     <div class="resource-account"><span>抖音号 <b>kanshanba</b></span><button type="button" data-resource-copy>复制账号</button></div>
     <p class="resource-feedback" role="status"></p>
    </div>
    <button class="resource-qr" type="button" data-community="follow" aria-haspopup="dialog">
     <span>扫码关注 →</span>
    </button>
   </div>
   <p class="resource-note">基础节点止于 2022 年，新时政以考前资料为准。</p>
  </div>
  <div class="study-dialog-footer resource-actions">
   <a id="atlasDownload" href="downloads/kaoyan-atlas-v6.1-67p.pdf" download="考研政治时间轴图册_v6.1_67页_分享版.pdf">下载本版 PDF</a>
   <a id="atlasPreview" href="downloads/kaoyan-atlas-v6.1-67p.pdf#page=1" target="_blank" rel="noopener">在线预览</a>
  </div>`;
 document.body.append(dialog);
 let opener = null;
 document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-study-atlas]');
  if (!trigger) return;
  event.preventDefault();
  if (dialog.open) return;
  opener = trigger;
  document.querySelector('audio')?.pause();
  document.dispatchEvent(new CustomEvent('study:dialogopen'));
  dialog.querySelector('.resource-feedback').textContent = '';
  dialog.showModal();
  dialog.querySelector('.study-dialog-body').scrollTop = 0;
  dialog.querySelector('.study-dialog-close').focus({ preventScroll: true });
 });
 dialog.querySelector('.study-dialog-close').onclick = () => dialog.close();
 dialog.addEventListener('close', () => {
  if (opener?.isConnected) opener.focus({ preventScroll: true });
 });
 dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
 });
 dialog.querySelector('[data-resource-copy]').onclick = async () => {
  const status = dialog.querySelector('.resource-feedback');
  try {
   await navigator.clipboard.writeText('kanshanba');
   status.textContent = '已复制，打开抖音搜索即可。';
  } catch {
   status.textContent = '请长按上方 kanshanba 复制。';
  }
 };
})();
