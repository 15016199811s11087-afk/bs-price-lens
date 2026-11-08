const $=(s,r=document)=>r.querySelector(s);
const appBaseUrl=new URL('./',import.meta.url);
const assetUrl=path=>new URL(path,appBaseUrl).href;
let apiBase='';
async function loadConfiguration(){const meta=$('meta[name="lens-config"]');if(!meta)return;const configUrl=new URL(meta.content,appBaseUrl);if(configUrl.origin!==location.origin)throw Error('The website configuration must be served with this website.');const response=await fetch(configUrl.href,{cache:'no-store'});if(!response.ok)throw Error('The website configuration could not be loaded.');const config=await response.json();const endpoint=new URL(config.apiBase);if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.pathname!=='/'||endpoint.search||endpoint.hash||endpoint.hostname==='chatgpt.site'||endpoint.hostname.endsWith('.chatgpt.site'))throw Error('The website API configuration is invalid.');apiBase=endpoint.origin;}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lang=localStorage.getItem('lens-language')||'en';
const l=(en,zh)=>lang==='zh'?zh:en;
const S={cards:[],raw:[],shops:[],manifest:{},route:'home',query:'',set:'all',type:'all',rarity:'all',color:'all',page:1,pageSize:30,tab:'all',trades:[],selected:null,offers:null,variant:'all',region:'all',stockOnly:false};
let groups=new Map(),numbers=new Map(),toastTimer,detailRevision=0;
const colors={red:'#d76a74',purple:'#9b75ba',green:'#8cae74',white:'#e8e5eb',yellow:'#ddc66c',blue:'#7399bf'};
const types={'トークンスピリット':'Token Spirit','トークンネクサス':'Token Nexus','スピリット':'Spirit','アルティメット':'Ultimate','ブレイヴ':'Brave','ネクサス':'Nexus','マジック':'Magic','契約スピリット':'Contract Spirit','契約アルティメット':'Contract Ultimate','契約ネクサス':'Contract Nexus','創界神ネクサス':'Grandwalker Nexus'};
const typeLabel=t=>types[t]||t||l('Other','其他');
const money=o=>new Intl.NumberFormat('en-HK',{style:'currency',currency:o.currency,maximumFractionDigits:o.currency==='JPY'?0:2}).format(o.price);
const when=v=>v?new Date(v).toLocaleString(lang==='zh'?'zh-HK':'en-GB',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Hong_Kong'}):'—';
const safeUrl=v=>{try{const u=new URL(v,location.origin);return['http:','https:'].includes(u.protocol)?u.href:'#';}catch{return'#';}};
const imageFor=n=>numbers.get(n)?.image||'';
function notify(s){$('#toast').textContent=s;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}
function keys(){try{return JSON.parse(localStorage.getItem('lens-trade-keys')||'[]');}catch{return[];}}
async function api(path,body){const r=await fetch(`${apiBase}/api${path}`,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d;}
function showDialog(html){$('#detail').innerHTML=html;if(!$('#detail').open)$('#detail').showModal();}
const dialogTop=title=>`<div class="dialog-top"><span>${title}</span><button class="close" data-action="close" aria-label="${l('Close','關閉')}">×</button></div>`;
function empty(title,text,action=''){return`<div class="empty"><div class="symbol">◇</div><h3>${title}</h3><p>${text}</p>${action}</div>`;}
function nav(){document.documentElement.lang=lang==='zh'?'zh-Hant':'en';$('#language').textContent=lang==='zh'?'EN':'繁中';$('#navigation').innerHTML=[['browse',l('Card archive','卡牌圖鑑')],['trades',l('Player trades','玩家交換')],['meta',l('Eternal meta','永恆賽制')],['shops',l('Shop directory','卡店指南')]].map(([id,label])=>`<a href="#${id}" class="${S.route===id?'active':''}" ${S.route===id?'aria-current="page"':''}>${label}</a>`).join('');$('#footer').innerHTML=`<div class="footer-identity"><a href="#home" class="brand"><span class="brand-mark">◈</span><span>BS <b>Price Lens</b></span></a><div class="maker-credit"><strong>Made by issac xiao</strong><span>Design Thinking Project 2</span></div></div><p>${l('Independent student project. Card information and artwork belong to BANDAI and their respective rights holders. Shop listings are asking prices, not completed sales. Prices and availability can change; confirm with the retailer before buying.','獨立學生專題。卡牌資訊及圖片版權屬 BANDAI 及相關權利人。店舖報價為公開叫價，並非成交價；價格及庫存可能變動，購買前請向卡店確認。')}</p>`;}
function showcase() {
  const art = (file, variant, width, height, alt = '') => `
    <div class="showcase-art showcase-art--${variant}">
      <img src="${assetUrl('assets/pixel/' + file + '.webp')}" alt="${esc(alt)}" width="${width}" height="${height}"
        ${variant === 'hero' ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
    </div>`;

  $('#main').innerHTML = `<div class="showcase">
    <div class="showcase-ribbon">
      <span>${l('Hong Kong shop listings first, with Japanese references.', '香港卡店優先，日本報價作參考。')}</span>
      <a href="#shops">${l('See sources', '查看報價來源')} <span aria-hidden="true">›</span></a>
    </div>
    <section class="showcase-hero" aria-labelledby="showcase-title">
      <div class="showcase-copy">
        <span class="showcase-eyebrow">BATTLE SPIRITS · HONG KONG</span>
        <h1 id="showcase-title">BS Price Lens</h1>
        <p>${l('Find cards. Compare shop prices. Trade with players.', '搵到想要嘅卡，睇清店舖報價。')}</p>
        <div class="showcase-actions">
          <a class="showcase-button" href="#browse">${l('Search cards', '查卡格價')}</a>
          <a class="showcase-button showcase-button--secondary" href="#meta">${l('Explore Eternal', '睇永恆賽制')}</a>
        </div>
      </div>
      ${art('showcase', 'hero', 1480, 740, l('Pixel art of Dan Bashin between a red dragon and a moonlight dragon', '馬神彈、紅金龍同月光龍嘅像素插圖'))}
    </section>
    <section class="showcase-panel showcase-panel--meta" aria-labelledby="showcase-meta-title">
      <div class="showcase-copy">
        <span class="showcase-eyebrow">ETERNAL FORMAT</span>
        <h2 id="showcase-meta-title">${l('Eternal deck results', '永恆賽制牌組分布')}</h2>
        <p>${l('See which archetypes won in the shop tournament sample.', '用互動餅圖睇店賽優勝樣本，了解各副牌組嘅分布。')}</p>
        <div class="showcase-actions">
          <a class="showcase-button" href="#meta">${l('Open the chart', '打開餅圖')}</a>
        </div>
        <div class="showcase-meta-summary">
          <span>${l('Ghost Demon', '幽魔')}</span>
          <span>${l('Moonlight', '月光龍')}</span>
          <span>${l('Sun', '太陽龍')}</span>
        </div>
      </div>
      ${art('eternal', 'meta', 780, 975)}
    </section>
    <div class="showcase-grid">
      <section class="showcase-panel showcase-panel--trades" aria-labelledby="showcase-trades-title">
        <div class="showcase-copy">
          <h2 id="showcase-trades-title">${l('Player trades', '玩家交換')}</h2>
          <p>${l('Find someone who wants the cards you can offer.', '用手上嘅重複卡，換你想要嘅卡。')}</p>
          <div class="showcase-actions">
            <a class="showcase-button" href="#trades">${l('Browse trades', '睇交換帖')}</a>
          </div>
        </div>
        ${art('exchange', 'tile', 920, 613)}
      </section>
      <section class="showcase-panel showcase-panel--shops" aria-labelledby="showcase-shops-title">
        <div class="showcase-copy">
          <h2 id="showcase-shops-title">${l('Shop directory', '卡店指南')}</h2>
          <p>${l('Check retailer sources, editions and stock.', '核對卡店來源、卡牌版本同庫存。')}</p>
          <div class="showcase-actions">
            <a class="showcase-button" href="#shops">${l('See shops', '睇卡店')}</a>
          </div>
        </div>
        ${art('shops', 'tile', 920, 613)}
      </section>
    </div>
  </div>`;
}
function filterOptions(values,chosen,label){return`<option value="all">${label}</option>`+values.map(([v,n])=>`<option value="${esc(v)}" ${v===chosen?'selected':''}>${esc(n)}</option>`).join('');}
function browse(){const sets=[...new Map(S.raw.map(c=>[c.set,c.setName||c.set])).entries()].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true}));const ts=[...new Set(S.raw.map(c=>c.type).filter(Boolean))].map(t=>[t,typeLabel(t)]);const rs=[...new Set(S.raw.map(c=>c.rarity).filter(Boolean))].sort().map(v=>[v,v]);$('#main').innerHTML=`<section class="content archive-content" id="archive"><div class="section-head"><div><h1>${l('The card archive','卡牌圖鑑')}</h1><p>${l('Find a card number, discover an edition, check a shop.','由卡號搵卡、分辨版本，再查詢店舖報價。')}</p></div><a class="quiet-link" href="#trades">${l('Looking to swap? Explore trades','想交換？前往玩家交換')} ↗</a></div><label class="search-box"><span class="search-icon">⌕</span><input id="search" type="search" placeholder="${l('Search a card number or name, e.g. BS67-X01','輸入卡號或卡名，例如 BS67-X01')}" value="${esc(S.query)}" aria-label="${l('Search cards','搜尋卡牌')}" autocomplete="off"><span class="search-shortcut">/</span></label><div class="filter-row"><select id="set" aria-label="${l('Product series','卡牌系列')}">${filterOptions(sets.map(([s,n])=>[s,`${s} · ${n}`]),S.set,l('All series','全部系列'))}</select><select id="type" aria-label="${l('Card type','卡牌種類')}">${filterOptions(ts,S.type,l('All card types','全部卡牌種類'))}</select><select id="rarity" aria-label="${l('Rarity','稀有度')}">${filterOptions(rs,S.rarity,l('All rarities','全部稀有度'))}</select><div class="color-filters" aria-label="${l('Filter by colour','按顏色篩選')}">${Object.entries(colors).map(([c,hex])=>`<button class="color-button ${S.color===c?'active':''}" style="--c:${hex}" title="${c[0].toUpperCase()+c.slice(1)}" aria-label="${c}" aria-pressed="${S.color===c}" data-action="color" data-id="${c}"></button>`).join('')}</div><button class="clear-filter" data-action="clear">${l('Reset','重設')}</button></div><div id="results"></div></section>`;renderGrid();$('#search').addEventListener('input',e=>{S.query=e.target.value;S.page=1;renderGrid();});for(const name of['set','type','rarity'])$('#'+name).addEventListener('change',e=>{S[name]=e.target.value;S.page=1;renderGrid();});}
function matched(){const q=S.query.trim().normalize('NFKC').toLowerCase().replace(/[‐‑–—]/g,'-');return S.cards.filter(c=>(!q||`${c.cardNumber} ${c.name} ${c.family||''} ${(c.faces||[]).map(f=>f.name+' '+(f.family||'')).join(' ')}`.toLowerCase().includes(q))&&(S.set==='all'||c.printings.some(p=>p.set===S.set))&&(S.type==='all'||c.type===S.type)&&(S.rarity==='all'||c.rarity===S.rarity)&&(S.color==='all'||c.colors?.includes(S.color)));}
function renderGrid(){const cs=matched();const pages=Math.max(1,Math.ceil(cs.length/S.pageSize));S.page=Math.min(pages,Math.max(1,S.page));const shown=cs.slice((S.page-1)*S.pageSize,S.page*S.pageSize);$('#results').innerHTML=`<div class="result-row"><span><b>${cs.length.toLocaleString()}</b> ${l('artwork / edition entries','款卡圖／版本')} ${S.query?`${l('for','符合')} “${esc(S.query)}”`:''}</span><span>${l('Select a card to compare shop listings','點選卡牌查看店舖報價')}</span></div>`+(shown.length?`<div class="card-grid">${shown.map(c=>`<article class="card-tile"><button class="card-image-wrap" data-action="detail" data-id="${esc(c.id)}" aria-label="${esc(c.cardNumber+' '+c.name)}"><span class="card-fallback">◈</span><img src="${esc(safeUrl(c.image))}" alt="${esc(c.name)}" loading="lazy" width="180" height="252"><span class="card-type-tag">${esc(typeLabel(c.type))}</span></button><div class="card-line"><span class="card-number">${esc(c.cardNumber)}</span><span class="rarity">${esc(c.rarity||'—')}</span></div><h3>${esc(c.name)}</h3><button class="quote-button" data-action="detail" data-id="${esc(c.id)}">${l('Compare shop listings','查看店舖報價')} <span>↗</span></button></article>`).join('')}</div><div class="pagination"><button data-action="page" data-page="1" ${S.page===1?'disabled':''} aria-label="First page">«</button><button data-action="page" data-page="${S.page-1}" ${S.page===1?'disabled':''} aria-label="Previous page">‹</button><span class="page-info">${S.page} / ${pages}</span><button data-action="page" data-page="${S.page+1}" ${S.page===pages?'disabled':''} aria-label="Next page">›</button><button data-action="page" data-page="${pages}" ${S.page===pages?'disabled':''} aria-label="Last page">»</button></div>`:empty(l('No matching cards','未搵到相符卡牌'),l('Try the printed card number or reset a filter. Japanese card names are searchable.','試下卡面印出嘅卡號，或重設篩選。亦可以用日文卡名搜尋。')));}
async function cardDetail(id){const c=groups.get(id)||numbers.get(id);if(!c)return;S.selected=c;S.offers=null;S.variant='all';S.region='all';S.stockOnly=false;const rev=++detailRevision;showDialog(dialogTop(`CARD DETAILS / ${esc(c.cardNumber)}`)+`<div class="detail-layout"><div class="detail-art"><img id="detail-image" src="${esc(safeUrl(c.image))}" alt="${esc(c.name)}">${c.faces?.length>1?`<button class="button small secondary" style="margin-top:12px" data-action="flip-card" data-side="0">${l('View other side','查看另一面')} ⇄</button>`:''}<small>${l('Official reference artwork. Check the shop listing for the actual edition and condition.','官方卡圖參考。實際版本及卡況以店舖商品頁為準。')}</small></div><div><div class="detail-heading"><div class="eyebrow">${esc(c.cardNumber)} <span class="rarity">${esc(c.rarity||'—')}</span></div><h2 id="detail-card-name">${esc(c.name)}</h2><div class="attribute-tags"><span>${esc(typeLabel(c.type))}</span><span>${esc((c.colors||[]).join(' / ')||l('Colour not listed','未列顏色'))}</span><span>${esc(c.variant||'standard')}</span></div>${c.printings.length>1?`<select class="edition-select" id="printing" aria-label="${l('Printing','收錄版本')}">${c.printings.map((p,i)=>`<option value="${i}">${esc(p.set+' · '+p.setName)}</option>`).join('')}</select>`:''}<a class="quiet-link" href="${esc(safeUrl(c.url))}" target="_blank" rel="noopener noreferrer">${l('Official card information','官方卡牌資料')} ↗</a></div><h3 class="detail-section-title">${l('Shop listings','店舖參考報價')}<small>HONG KONG FIRST</small></h3><p class="quote-explain">${l('Prices are retailer asking prices. Match the edition and condition before comparing. JPY listings exclude currency conversion, shipping and proxy fees.','報價為店舖公開叫價。比較時請核對版本及卡況。日圓報價未含兌換、運費或代購費。')}</p><div class="filter-row" style="padding:0 0 4px"><select id="offer-region" aria-label="Shop region"><option value="all">${l('HK + Japan','香港＋日本')}</option><option value="HK">${l('Hong Kong only','只看香港')}</option><option value="JP">${l('Japan only','只看日本')}</option></select><select id="offer-variant" aria-label="Edition"><option value="all">${l('All listed editions','全部報價版本')}</option><option value="standard">${l('Regular edition','普通版')}</option><option value="parallel">${l('Parallel / SECRET','異畫／SECRET')}</option><option value="special">${l('Special editions','特別版本')}</option></select><label style="font-size:10px;color:#82708f"><input id="stock-only" type="checkbox"> ${l('In stock','有貨')}</label></div><div id="offers"><div class="status-message"><span class="spinner"></span>${l('Checking public shop listings…','查詢店舖公開報價中…')}</div></div><div class="detail-actions"><button class="button" data-action="new-trade" data-have="${esc(c.cardNumber)}">${l('Offer this card for trade','用呢張卡提出交換')} ⇄</button><a href="#trades" class="button secondary" data-action="close">${l('Browse player trades','瀏覽玩家交換')}</a></div></div></div>`);
$('#offer-region').onchange=e=>{S.region=e.target.value;renderOffers();};$('#offer-variant').onchange=e=>{S.variant=e.target.value;renderOffers();};$('#stock-only').onchange=e=>{S.stockOnly=e.target.checked;renderOffers();};if($('#printing'))$('#printing').onchange=e=>{$('#detail-image').src=c.printings[Number(e.target.value)].image;};
try{const d=await api(`/offers?card=${encodeURIComponent(c.cardNumber)}`);if(rev!==detailRevision)return;S.offers=d;renderOffers();}catch(e){if(rev!==detailRevision)return;$('#offers').innerHTML=`<div class="status-message">${esc(e.message)}</div>${sourceLinks(c.cardNumber)}`;}}
function sourceLinks(n,sources=[]){return`<div class="source-links">${S.shops.filter(s=>S.region==='all'||S.region===s.region).map(s=>{const state=sources.find(x=>x.shopId===s.id);const note=state?.status==='error'?l('Could not check · open shop','讀取失敗 · 前往店舖'):state?.status==='partial'?l('Partial check · open shop for full results','部分資料 · 請到店舖核對'):state?.status==='search-only'||s.mode==='search'?l('Search link · stock unverified','搜尋連結 · 未核實庫存'):state?.count===0?l('No matching listing returned','未有相符報價'):l('View all matching products','查看店舖商品');return`<a class="source-link" href="${esc(safeUrl(s.searchUrlTemplate.replace('{cardNumber}',encodeURIComponent(n))))}" target="_blank" rel="noopener noreferrer"><span>${esc(s.name)} ↗</span><small>${note}</small></a>`;}).join('')}</div>`;}
function renderOffers(){if(!S.offers||!$('#offers'))return;const d=S.offers;const offers=d.offers.filter(o=>(S.region==='all'||S.region===o.region)&&(S.variant==='all'||S.variant===o.variant)&&(!S.stockOnly||o.inStock===true));$('#offers').innerHTML=`<div class="result-row" style="margin:10px 0"><span>${offers.length} ${l('listings','個報價')}</span><span>${l('Checked','核實於')} ${esc(when(d.checkedAt))} HKT</span></div>`+(offers.length?offers.map(o=>`<div class="offer-row"><div><h4>${o.region==='HK'?'HK':'JP'} · ${esc(o.shopName)}</h4><div class="offer-title">${esc(o.title)}</div><span class="stock ${o.inStock===true?'':o.inStock===false?'out':'unknown'}">${o.inStock===true?l('In stock','有貨'):o.inStock===false?l('Sold out','售罄'):l('Stock unconfirmed','庫存未確認')}</span><span style="font-size:8px;color:#95839f">${esc(o.variant)} · ${esc(o.condition==='未標示'?l('Condition not stated','卡況未列明'):o.condition)}</span></div><div class="offer-price">${esc(money(o))}<small>${esc(o.currency)} · ${l('asking price','店舖叫價')}</small>${o.currency==='JPY'&&d.fx?`<small>≈ HK$${(o.price*d.fx.rate).toFixed(2)}<br>Frankfurter · ${esc(d.fx.date)}</small>`:''}</div><a href="${esc(safeUrl(o.url))}" target="_blank" rel="noopener noreferrer">${l('Open product','前往商品')} ↗</a></div>`).join(''):`<p class="status-message">${l('No verified listings match these filters. You can search the retailers directly below.','暫未有符合篩選嘅已核實報價，可以直接到以下卡店搜尋。')}</p>`)+sourceLinks(S.selected.cardNumber,d.sources);}
const demoDragonTradeId = '218cb345-2c9b-40c5-972b-716f64900bcf';
const demoDragonArt = {
  'BSC50-XV04': {file: 'moonlight.webp', name: ['Moonlight Dragon XV', '月光龍 XV']},
  'BSC50-XV01': {file: 'sunlight.webp', name: ['Sun Dragon XV', '太陽龍 XV']},
};

function tradeImage(cardNumber, illustrated) {
  const original = esc(safeUrl(imageFor(cardNumber)));
  if (!illustrated) return `<img src="${original}" alt="${esc(cardNumber)}">`;
  const {file, name} = demoDragonArt[cardNumber];
  const title = l(...name);
  return `<img class="trade-dragon" src="${assetUrl('assets/pixel/' + file)}" alt="" width="128" height="128">
    <strong class="trade-dragon-name">${title}</strong>
    <a class="trade-original" href="${original}" target="_blank" rel="noopener noreferrer"
      aria-label="${l('Official card art', '官方卡圖')} · ${title}">${l('Official card art', '官方卡圖')} ↗</a>`;
}

function tradeCard(t,mine=false){
  const illustrated = t.id === demoDragonTradeId && t.have === 'BSC50-XV04' && t.want === 'BSC50-XV01';
  return`<article class="trade-card"><div class="trade-person"><strong>${esc(t.alias)}</strong><small>${esc(t.area)}</small></div><div class="trade-pair${illustrated ? ' trade-pair--illustrated' : ''}"><div><small>${l('HAS TO TRADE','可交換')}</small>${tradeImage(t.have, illustrated)}<b>${esc(t.have)} × ${t.quantity}</b></div><span>⇄</span><div><small>${l('LOOKING FOR','想要')}</small>${tradeImage(t.want, illustrated)}<b>${esc(t.want)}</b></div></div>${illustrated ? `<p class="trade-art-note">${l('Pixel illustrations', '像素插圖')}</p>` : ''}<p class="trade-info">${esc(t.condition)}${t.note?`<br>${esc(t.note)}`:''}</p>${t.photo?`<a class="quiet-link" href="${esc(safeUrl(t.photo))}" target="_blank" rel="noopener noreferrer">${l('View owner photo','查看玩家實物相')} ↗</a>`:''}${mine?`<div class="trade-info">${l('Contact','聯絡方式')}: ${esc(t.contact)}</div>${(t.proposals||[]).map(p=>`<div class="proposal"><b>${esc(p.alias)}</b> · ${esc(when(p.createdAt))}<p>${esc(p.message)}</p><strong>${l('Contact','聯絡方式')}: ${esc(p.contact)}</strong></div>`).join('')}${t.status==='open'?`<button class="button secondary" data-action="close-trade" data-id="${t.id}">${l('Close listing','關閉交換帖')}</button>`:`<div class="status-message">${l('Listing closed','交換帖已關閉')}</div>`}`:`<button class="button secondary" data-action="proposal" data-id="${t.id}">${l('Propose an exchange','提出交換建議')} ↗</button>`}<div class="trade-meta"><span>${l('Player listing','玩家刊登')}</span><span>${esc(when(t.createdAt))}</span></div></article>`;}
async function trades(){const routeRevision=Date.now();S.tradeRevision=routeRevision;$('#main').innerHTML=`<section class="page-intro"><div class="page-intro-inner"><div><div class="eyebrow">PLAYER TO PLAYER</div><h1>${l('A spare card. A new possibility.','多餘嘅卡，交換成新可能。')}</h1><p>${l('List what you have and what you want. Find another player, compare references, and agree on an exchange together.','列出你有嘅卡同想要嘅卡。搵到合適玩家，參考卡價，再一齊商議交換條件。')}</p></div><button class="button" data-action="new-trade">＋ ${l('Create a trade listing','刊登交換卡牌')}</button></div></section><section class="content"><div class="tabs"><button data-action="tab" data-tab="all" class="${S.tab==='all'?'selected':''}">${l('Open listings','公開交換')}</button><button data-action="tab" data-tab="matches" class="${S.tab==='matches'?'selected':''}">${l('My matches','我的配對')}</button><button data-action="tab" data-tab="mine" class="${S.tab==='mine'?'selected':''}">${l('My listings & replies','我的刊登及回覆')}</button></div><div id="trade-results"><div class="status-message"><span class="spinner"></span>${l('Loading trades…','載入交換帖…')}</div></div><div class="information-box"><h3>${l('A reference for your conversation','用卡價協助商議')}</h3>${l('Search either card in the archive to compare shop asking prices. Editions, card condition and personal preference affect an exchange. Contact details submitted in a proposal are shared with the listing owner. Manage your listings on this browser, or save your management key for another device.','可以喺圖鑑查詢雙方卡牌嘅店舖叫價。版本、卡況同個人需要都會影響交換條件。交換建議內嘅聯絡方式會交俾刊登者。你可以喺本瀏覽器管理交換帖，或保存管理碼到其他裝置使用。')} <button class="clear-filter" data-action="restore">${l('Restore a listing','用管理碼恢復交換帖')}</button></div></section>`;
try{const [all,mine]=await Promise.all([api('/trades'),api('/trades/mine',{keys:keys()})]);if(S.route!=='trades'||S.tradeRevision!==routeRevision)return;S.trades=all.trades;S.mine=mine.trades;let selected=S.tab==='mine'?S.mine:S.trades;if(S.tab==='matches'){selected=S.trades.filter(t=>S.mine.some(m=>m.status==='open'&&m.have===t.want&&m.want===t.have&&m.id!==t.id));}$('#trade-results').innerHTML=selected.length?`<div class="trade-grid">${selected.map(t=>tradeCard(t,S.tab==='mine')).join('')}</div>`:empty(S.tab==='matches'?l('Your next match starts with a list','先列出你有同想要嘅卡'):S.tab==='mine'?l('Your trading space','你嘅交換空間'):l('Be the first to offer a swap','由你開始第一個交換'),S.tab==='matches'?l('Create a listing with a card you have and a card you want. Mutual matches will appear here.','刊登你有同想要嘅卡。有雙向需求嘅玩家就會喺度出現。'):l('Create a listing and give another player a chance to find the card they need.','刊登手上願意交換嘅卡，等其他玩家搵到佢需要嘅一張。'),`<button class="button" data-action="new-trade">＋ ${l('Create a listing','刊登交換')}</button>`);}catch(e){if($('#trade-results'))$('#trade-results').innerHTML=empty(l('Trades could not load','暫時未能載入交換帖'),esc(e.message),`<button class="button" data-action="reload-trades">${l('Try again','重試')}</button>`);}}
function cardListOptions(){return`<datalist id="card-numbers"></datalist>`;}
function bindCardSuggestions(){for(const input of document.querySelectorAll('[data-card-input]'))input.addEventListener('input',()=>{const q=input.value.toUpperCase();if(q.length<2)return;$('#card-numbers').innerHTML=[...numbers.keys()].filter(n=>n.toUpperCase().includes(q)).slice(0,40).map(n=>`<option value="${esc(n)}">${esc(numbers.get(n).name)}</option>`).join('');});}
function newTrade(have=''){showDialog(dialogTop(l('NEW PLAYER TRADE','新增玩家交換'))+`<form id="trade-form" class="dialog-form"><h2>${l('What would you like to swap?','你想交換邊張卡？')}</h2><p>${l('Choose the printed card numbers. Your contact details are visible only to you here; other players submit their contact details in a private proposal.','請選擇卡面印出嘅卡號。你嘅聯絡方式只會喺自己管理頁顯示；其他玩家可以透過私人交換建議留下聯絡方法。')}</p><div class="form-grid"><label class="form-field">${l('Your display name','顯示名稱')}<input name="alias" required maxlength="40" autocomplete="nickname"></label><label class="form-field">${l('Meeting area','交收地區')}<input name="area" required maxlength="80" placeholder="${l('e.g. Mong Kok / online discussion','例如旺角／先網上商議')}"></label><label class="form-field">${l('Card you have','你願意交換嘅卡')}<input name="have" data-card-input list="card-numbers" required maxlength="60" placeholder="BS67-X01" value="${esc(have)}"></label><label class="form-field">${l('Card you want','你想要嘅卡')}<input name="want" data-card-input list="card-numbers" required maxlength="60" placeholder="BS68-X01"></label><label class="form-field">${l('Quantity available','可交換數量')}<input name="quantity" type="number" value="1" min="1" max="99" required></label><label class="form-field">${l('Edition and condition','版本及卡況')}<input name="condition" maxlength="160" required placeholder="${l('e.g. regular, near mint','例如普通版、近全新')}"></label><label class="form-field full">${l('Your contact method (for your own record)','聯絡方法（留作自己記錄）')}<input name="contact" required maxlength="160" placeholder="Instagram / email / other"><small>${l('The listing owner receives proposals in My listings & replies.','刊登者可於「我的刊登及回覆」查看收到嘅交換建議。')}</small></label><label class="form-field full">${l('Owner photo link (optional)','實物相連結（選填）')}<input name="photo" type="url" maxlength="1000" placeholder="https://…"></label><label class="form-field full">${l('Exchange notes (optional)','交換補充（選填）')}<textarea name="note" maxlength="600" placeholder="${l('Edition wanted, available meeting times, exchange preferences…','想要嘅版本、可交收時間、交換偏好…')}"></textarea></label></div>${cardListOptions()}<div class="form-error" role="alert"></div><div class="form-actions"><button class="button secondary" type="button" data-action="close">${l('Cancel','取消')}</button><button class="button" type="submit">${l('Publish trade listing','刊登交換帖')} ↗</button></div></form>`);bindCardSuggestions();$('#trade-form').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget;const btn=$('[type=submit]',form);btn.disabled=true;try{const d=await api('/trades',Object.fromEntries(new FormData(form)));const ks=keys();ks.push({id:d.trade.id,token:d.managementKey});localStorage.setItem('lens-trade-keys',JSON.stringify(ks));showDialog(dialogTop(l('LISTING PUBLISHED','交換帖已刊登'))+`<div class="dialog-form"><h2>${l('Your card is ready to be found.','你嘅交換帖已經上架。')}</h2><p>${l('Save this private management key to restore your listing on another device. It grants access to replies and lets you close the listing.','請保存私人管理碼，以便喺其他裝置恢復交換帖、查看回覆及關閉刊登。')}</p><label class="form-field">${l('Listing ID','交換帖編號')}<input readonly value="${esc(d.trade.id)}"></label><label class="form-field" style="margin-top:15px">${l('Private management key','私人管理碼')}<input readonly value="${esc(d.managementKey)}"></label><div class="form-actions"><button class="button" data-action="my-trades">${l('Open my listings','前往我的刊登')}</button></div></div>`);}catch(error){$('.form-error',form).textContent=error.message;btn.disabled=false;}};}
function propose(id){const t=S.trades.find(x=>x.id===id);if(!t)return;showDialog(dialogTop(l('EXCHANGE PROPOSAL','提出交換建議'))+`<form id="proposal-form" class="dialog-form"><h2>${l('Start a conversation','同玩家傾下交換')}</h2><p>${esc(t.alias)} ${l('offers','願意交換')} ${esc(t.have)} × ${t.quantity} ${l('and is looking for','，想要')} ${esc(t.want)}. ${l('This proposal and your contact method will be visible to the listing owner.','呢個建議同你填寫嘅聯絡方式會交俾刊登者。')}</p><div class="form-grid"><label class="form-field">${l('Your display name','你嘅顯示名稱')}<input name="alias" required maxlength="40"></label><label class="form-field">${l('How the owner can contact you','刊登者可以點聯絡你')}<input name="contact" required maxlength="160" placeholder="Instagram / email / other"></label><label class="form-field full">${l('Your exchange proposal','你嘅交換建議')}<textarea name="message" required maxlength="1000" placeholder="${l('Which card and edition can you offer? Include its condition and the exchange you suggest.','你可以提供邊張卡、咩版本、卡況同建議交換方式？')}"></textarea></label></div><div class="form-error" role="alert"></div><div class="form-actions"><button type="button" class="button secondary" data-action="close">${l('Cancel','取消')}</button><button type="submit" class="button">${l('Send to listing owner','交俾刊登者')} ↗</button></div></form>`);$('#proposal-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;const b=$('[type=submit]',f);b.disabled=true;try{await api(`/trades/${id}/proposals`,Object.fromEntries(new FormData(f)));$('#detail').close();notify(l('Proposal delivered. The owner can contact you using the details you provided.','交換建議已送達，刊登者可以用你提供嘅方法聯絡你。'));}catch(error){$('.form-error',f).textContent=error.message;b.disabled=false;}};}
function restore(){showDialog(dialogTop(l('RESTORE A LISTING','恢復管理交換帖'))+`<form id="restore-form" class="dialog-form"><h2>${l('Bring your listing to this browser','喺呢個瀏覽器管理交換帖')}</h2><div class="form-grid"><label class="form-field full">Listing ID<input name="id" required></label><label class="form-field full">Private management key<input name="token" required></label></div><div class="form-error" role="alert"></div><div class="form-actions"><button class="button" type="submit">${l('Restore','恢復')}</button></div></form>`);$('#restore-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;const k=Object.fromEntries(new FormData(f));try{const d=await api('/trades/mine',{keys:[k]});if(!d.trades.length)throw Error(l('No listing matches this key.','管理碼同交換帖編號唔相符。'));const ks=keys().filter(x=>x.id!==k.id);ks.push(k);localStorage.setItem('lens-trade-keys',JSON.stringify(ks));$('#detail').close();S.tab='mine';trades();}catch(e){$('.form-error',f).textContent=e.message;}};}
function shops(){const sorted=S.shops.slice().sort((a,b)=>(a.region==='HK'?0:1)-(b.region==='HK'?0:1));$('#main').innerHTML=`<section class="page-intro"><div class="page-intro-inner"><div><div class="eyebrow">PRICES WITH CONTEXT</div><h1>${l('Know where a price comes from.','知道每個報價由邊度嚟。')}</h1><p>${l('Hong Kong shops first, with Japanese listings for reference. Every price links to its retailer and carries a check time.','香港卡店優先，日本報價作參考。每個價錢都附店舖連結同查詢時間。')}</p></div></div></section><section class="content"><div class="shop-grid">${sorted.map(s=>`<article class="shop-card"><div class="shop-logo">${s.region}</div><span class="region-label">${s.currency} · ${s.mode==='live'?l('PUBLIC LISTING CHECKS','公開報價查詢'):l('SHOP SEARCH LINK','店舖搜尋連結')}</span><h3 style="margin-top:14px">${esc(s.name)}</h3><p>${lang==='zh'?esc(s.description):s.mode==='search'?'Search the retailer directly. No price or stock verification is provided for this directory link.':s.region==='HK'?'Hong Kong retailer. Public product asking prices and online stock indicators are checked when you open a card.':'Japanese reference listings. Editions and card condition remain visible. Shipping and proxy fees are excluded.'}</p><a class="quiet-link" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${l('Visit shop','前往卡店')} ↗</a></article>`).join('')}</div><div class="information-box"><h3>${l('Catalogue coverage','卡庫覆蓋範圍')}</h3>${l(`${Number(S.manifest.uniqueCardNumbers||numbers.size).toLocaleString()} distinct card numbers across ${S.manifest.productCount||288} official Japanese product lists. ${Number(S.manifest.totalPrintings||S.raw.length).toLocaleString()} product printings are retained, including reprints and official alternate identities. Official lists do not always distinguish every physical foil treatment.`,`${Number(S.manifest.uniqueCardNumbers||numbers.size).toLocaleString()} 個不同卡號，涵蓋 ${S.manifest.productCount||288} 個日本官方產品分類。保留 ${Number(S.manifest.totalPrintings||S.raw.length).toLocaleString()} 筆收錄資料，包括再版及官方獨立異畫。官方卡庫未必逐一列出所有實體閃卡工藝版本。`)}<br>${l('Catalogue checked','卡庫核對於')}: ${esc(when(S.manifest.checkedAt))} HKT. <a href="https://www.battlespirits.com/cardlist/" target="_blank" rel="noopener noreferrer">${l('Official catalogue','官方卡庫')} ↗</a></div><div class="information-box"><h3>${l('Reading price and stock information','點樣理解價格同庫存')}</h3>${l('A shop asking price is not a completed-sale price. Regular, SECRET, special editions and different conditions must be compared separately. “In stock” reflects the shop’s online indicator at the check time; it does not confirm shelf stock in a physical branch. If a source cannot be reached, its status stays unconfirmed. No automated authentication or guaranteed exchange value is provided.','店舖叫價並非成交價。普通版、SECRET、特別版同不同卡況需要分開比較。「有貨」反映查詢時間店舖網頁嘅供應指標，唔代表實體分店現貨。未能讀取嘅來源會標示為未確認。交換價值由雙方按版本、卡況同需要協商。')}</div></section>`;}
const metaColors = ['#7848c6', '#d96684', '#5167c7', '#16867c', '#cb7443', '#a74ba1',
  '#496dad', '#7c853b', '#ae5c72', '#4d83a2', '#956139', '#647498', '#aab1c5'];
let eternalSnapshot;

async function showEternalMeta() {
  const main = $('#main');
  main.innerHTML = `<div class="loading-screen"><span class="spinner"></span><p>${l('Loading Eternal results…', '載入永恆賽果…')}</p></div>`;
  try {
    if (!eternalSnapshot) {
      const response = await fetch(assetUrl('data/eternal-meta.json?v=eternal-art'), {cache: 'no-cache'});
      if (!response.ok) throw new Error('Eternal snapshot could not be loaded.');
      eternalSnapshot = await response.json();
    }
    if (S.route === 'meta') renderEternalMeta(eternalSnapshot);
  } catch (error) {
    if (S.route === 'meta') main.innerHTML = empty(
      l('Eternal results are unavailable', '暫時未能載入永恆賽果'),
      l('Refresh the page to try again.', '請重新整理網頁再試。')
    );
    console.error(error);
  }
}

function renderEternalMeta(snapshot) {
  const {period, sampleSize, publishedDecklists, archetypes, artwork} = snapshot;
  // The source prints whole percentages. Recover the nearest number of decks
  // for the slice sizes, and keep the original rounded labels in the legend.
  const rows = archetypes.map(({name, percent}) => ({
    name, count: Math.round(sampleSize * percent / 100), share: percent + '%'
  }));
  const remaining = sampleSize - rows.reduce((total, row) => total + row.count, 0);
  if (remaining > 0) rows.push({
    name: l('Other unlabelled decks', '其他未標名牌組'),
    count: remaining,
    share: '≈' + (100 * remaining / sampleSize).toFixed(1) + '%'
  });

  const center = 110;
  const radius = 109;
  const point = (share, horizontalRadius, verticalRadius = horizontalRadius) => {
    const angle = 2 * Math.PI * share - Math.PI / 2;
    return [center + horizontalRadius * Math.cos(angle), center + verticalRadius * Math.sin(angle)];
  };
  let offset = 0;
  const slices = rows.map((row, index) => {
    const size = row.count / sampleSize;
    const start = point(offset, radius).join(' ');
    const labelPosition = point(offset + size / 2, radius + 26, radius + 33);
    offset += size;
    const shape = size === 1
      ? `circle cx="${center}" cy="${center}" r="${radius}"`
      : `path d="M ${center} ${center} L ${start} A ${radius} ${radius} 0 ${Number(size > .5)} 1 ${point(offset, radius).join(' ')} Z"`;
    return {shape, labelPosition, color: metaColors[index % metaColors.length]};
  });
  const fallback = slices.map(({shape, color}) => `<${shape} fill="${color}" />`).join('');
  const controls = slices.map(({shape}, index) => {
    return `<${shape} class="meta-slice" data-meta-index="${index}" />`;
  }).join('');
  const labels = archetypes.map(({name}, index) => {
    const {labelPosition: [x, y], color} = slices[index];
    return `<g class="meta-label" transform="translate(${x} ${y})" data-meta-index="${index}" style="--slice-color:${color}">
      <rect x="-22" y="-13" width="44" height="25" fill="transparent" />
      <text y="-3">${esc(name)}<tspan x="0" dy="12">${esc(rows[index].share)}</tspan></text>
    </g>`;
  }).join('');
  const picture = artwork ? `
    <defs><clipPath id="meta-art-clip"><circle cx="${center}" cy="${center}" r="${radius}" /></clipPath></defs>
    <g clip-path="url(#meta-art-clip)">
      <svg width="220" height="220" viewBox="${esc(artwork.viewBox)}">
        <image width="${esc(artwork.width)}" height="${esc(artwork.height)}"
          href="${esc(assetUrl('assets/meta/' + artwork.file))}" />
      </svg>
    </g>` : '';

  $('#main').innerHTML = `
    <section class="page-intro">
      <div class="page-intro-inner">
        <div>
          <div class="eyebrow">BATTLE SPIRITS · ETERNAL</div>
          <h1>${l('Eternal shop tournament winners', '永恆賽制店賽優勝分布')}</h1>
          <p>${l('See which decks appeared most often among the winners in this weekly sample.', '想了解返永恆賽制嘅環境？先睇呢星期樣本入面邊幾副牌組最常優勝。')}</p>
        </div>
        <span class="meta-period">${esc(period)}</span>
      </div>
    </section>
    <section class="content meta-content">
      <div class="meta-stats">
        <div><strong>${sampleSize}</strong><span>${l('Winning decks sampled', '優勝牌組樣本')}</span></div>
        <div><strong>${publishedDecklists}</strong><span>${l('Decklists published', '公開牌表')}</span></div>
        <div><strong>${sampleSize - publishedDecklists}</strong><span>${l('Decklists unpublished', '未公開牌表')}</span></div>
      </div>
      <div class="meta-panel">
        <div class="meta-visual">
          <h2>${l('Share of sampled winners', '樣本內優勝佔比')}</h2>
          <svg class="meta-pie" viewBox="-48 -32 316 302" aria-hidden="true">${fallback}${picture}${controls}${labels}</svg>
          <p>${l('Select a slice or a deck name.', '點選餅圖一格，或者點牌組名稱。')}</p>
        </div>
        <div class="meta-legend">
          <h2>${l('Decks in this sample', '樣本牌組')}</h2>
          <div class="meta-selection" aria-live="polite">
            <strong id="meta-share"></strong>
            <span id="meta-name"></span>
            <small id="meta-count"></small>
          </div>
          <div class="meta-legend-items">
            ${rows.map((row, index) => `<button type="button" class="meta-deck" data-meta-index="${index}" aria-pressed="false">
              <span class="meta-swatch" style="background:${metaColors[index % metaColors.length]}"></span>
              <span>${esc(row.name)}</span><strong>${esc(row.share)}</strong>
            </button>`).join('')}
          </div>
        </div>
      </div>
      <aside class="information-box">
        <h3>${l('How to read this chart', '點樣睇呢個餅圖')}</h3>
        <p>${l('These shares show how often each deck appeared among the sampled shop tournament winners. Match win rates require the number of matches played. The source covers selected events using basic rules with at least six players, with unpublished attendance assumed to meet that threshold.', '佔比反映牌組喺呢批店賽優勝樣本出現幾多，計對局勝率要有對局總數。來源只涵蓋部分採用基本規則、至少六人參與嘅店賽，冇公布人數嘅賽事按來源假設達到門檻。')}</p>
        <p>${l('Named shares retain the screenshot’s rounded labels. Slice sizes and approximate deck counts use the 67-deck total. Unlabelled slices are grouped under Other.', '有標名嘅佔比沿用截圖嘅整數百分比。扇形大小同約數以 67 副樣本推算，冇標名嘅部分合併為「其他」。')}</p>
        <p>${l('Data and slice artwork are from the supplied screenshot of the Eternal shop tournament winners chart for 26 October to 1 November 2026.', '數據同扇形卡圖取自提供嘅《店家優勝（永恆）》截圖，統計期係 2026 年 10 月 26 日至 11 月 1 日。')}</p>
      </aside>
    </section>`;

  function select(index) {
    const row = rows[index];
    $('#meta-share').textContent = row.share;
    $('#meta-name').textContent = row.name;
    $('#meta-count').textContent = l(`About ${row.count} of ${sampleSize} decks`, `約 ${row.count} / ${sampleSize} 副`);
    for (const control of document.querySelectorAll('[data-meta-index]')) {
      const active = Number(control.dataset.metaIndex) === index;
      control.classList.toggle('selected', active);
      if (control.tagName === 'BUTTON') control.setAttribute('aria-pressed', String(active));
    }
  }

  $('.meta-panel').addEventListener('click', event => {
    const control = event.target.closest('[data-meta-index]');
    if (control) select(Number(control.dataset.metaIndex));
  });
  select(0);
}

let archiveLoad;
let archiveLoaded = false;
let routeRevision = 0;

async function loadArchive() {
  const [raw, manifest, shopsData] = await Promise.all(
    ['catalogue.json', 'catalogue-manifest.json', 'shops.json'].map(async file => {
      const response = await fetch(assetUrl('data/' + file));
      if (!response.ok) throw new Error('Unable to load ' + file);
      return response.json();
    })
  );
  S.raw = Array.isArray(raw) ? raw : raw.cards;
  S.manifest = manifest;
  S.shops = shopsData;

  const index = new Map();
  for (const card of S.raw) {
    if (!numbers.has(card.cardNumber)) numbers.set(card.cardNumber, card);
    const key = card.cardNumber + '|' + card.image;
    let group = index.get(key);
    if (!group) {
      group = {...card, printings: []};
      index.set(key, group);
      groups.set(group.id, group);
    }
    group.printings.push(card);
  }
  const priority = number => /^26R/.test(number) ? 3 : /^BS[0-9]/.test(number) ? 2 : 1;
  S.cards = [...index.values()].sort((a, b) =>
    priority(b.cardNumber) - priority(a.cardNumber) ||
    b.cardNumber.localeCompare(a.cardNumber, undefined, {numeric: true})
  );
  archiveLoaded = true;
}

function archiveError(error) {
  $('#main').innerHTML = empty(
    l('The archive could not load', '卡庫暫時未能載入'),
    l('Please refresh the page to try again.', '請重新整理網頁再試一次。')
  );
  console.error(error);
}

async function route() {
  const revision = ++routeRevision;
  const hash = location.hash.slice(1).split('/')[0];
  S.route = ['browse', 'trades', 'meta', 'shops'].includes(hash) ? hash : 'home';
  nav();
  if (S.route === 'home') {
    showcase();
    return;
  }
  if (S.route === 'meta') {
    await showEternalMeta();
    return;
  }

  if (!archiveLoaded) {
    $('#main').innerHTML = `<div class="loading-screen"><span class="spinner"></span><p>${l('Opening the card archive…', '載入卡牌圖鑑…')}</p></div>`;
    try {
      archiveLoad ||= loadArchive().catch(error => {
        archiveLoad = undefined;
        throw error;
      });
      await archiveLoad;
    } catch (error) {
      if (revision === routeRevision) archiveError(error);
      return;
    }
    if (revision !== routeRevision) return;
  }

  if (S.route === 'browse') browse();
  else if (S.route === 'trades') trades();
  else shops();
}
document.addEventListener('click',async e=>{const el=e.target.closest('[data-action]');if(!el||el.disabled)return;const a=el.dataset.action;try{if(a==='flip-card'){const fs=S.selected?.faces||[];const i=(Number(el.dataset.side)+1)%fs.length;el.dataset.side=String(i);$('#detail-image').src=fs[i].image;$('#detail-card-name').textContent=fs[i].name;}else if(a==='close'){$('#detail').close();detailRevision++;}else if(a==='detail')cardDetail(el.dataset.id);else if(a==='color'){S.color=S.color===el.dataset.id?'all':el.dataset.id;S.page=1;browse();}else if(a==='clear'){S.query='';S.set=S.type=S.rarity=S.color='all';S.page=1;browse();}else if(a==='page'){S.page=Number(el.dataset.page);renderGrid();$('#archive').scrollIntoView({behavior:'smooth'});}else if(a==='new-trade')newTrade(el.dataset.have||'');else if(a==='tab'){S.tab=el.dataset.tab;trades();}else if(a==='proposal')propose(el.dataset.id);else if(a==='restore')restore();else if(a==='my-trades'){$('#detail').close();S.tab='mine';if(S.route!=='trades')location.hash='trades';else trades();}else if(a==='reload-trades')trades();else if(a==='close-trade'){if(!confirm(l('Close this trade listing?','確認關閉呢個交換帖？')))return;const k=keys().find(k=>k.id===el.dataset.id);await api(`/trades/${el.dataset.id}/close`,{token:k?.token});trades();}}catch(error){notify(error.message);}});
$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=$('#detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#detail').close();}});
$('#language').onclick=()=>{lang=lang==='en'?'zh':'en';localStorage.setItem('lens-language',lang);$('#detail').close();route();};
addEventListener('hashchange',()=>{route();window.scrollTo(0,0);});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&$('#search')){e.preventDefault();$('#search').focus();}});
$('.skip-link').onclick = event => {
  event.preventDefault();
  $('#main').focus();
};
try {
  await loadConfiguration();
  await route();
} catch (error) {
  archiveError(error);
}
