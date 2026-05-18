(function () {
  const data = window.BFDB_DATA || { imageRoot: "assets/images", units: [], items: [] };
  const savedSettings = readSettings();
  const state = {
    view: savedSettings.defaultView || "units",
    query: "",
    server: "GL",
    element: "all",
    type: "all",
    sort: "id-asc",
    pageSize: normalizePageSize(savedSettings.pageSize),
    unitDetailMode: savedSettings.unitDetailMode === "extended" ? "extended" : "simple",
    pages: { units: 1, items: 1 },
    selectedUnitKey: data.units[0] && unitKey(data.units[0]),
    selectedItemKey: data.items[0] && itemKey(data.items[0]),
    lastListView: "units",
    detailCache: {},
    itemDetailCache: {}
  };

  const elements = {
    viewTitle: document.querySelector("#view-title"),
    search: document.querySelector("#search-input"),
    serverFilter: document.querySelector("#server-filter"),
    elementFilter: document.querySelector("#element-filter"),
    typeFilter: document.querySelector("#type-filter"),
    typeFilterLabel: document.querySelector("#type-filter-label"),
    sortSelect: document.querySelector("#sort-select"),
    clearFilters: document.querySelector("#clear-filters"),
    unitGrid: document.querySelector("#unit-grid"),
    itemGrid: document.querySelector("#item-grid"),
    unitCount: document.querySelector("#unit-count"),
    itemCount: document.querySelector("#item-count"),
    unitResultSummary: document.querySelector("#unit-result-summary"),
    itemResultSummary: document.querySelector("#item-result-summary"),
    unitPageStatus: document.querySelector("#unit-page-status"),
    itemPageStatus: document.querySelector("#item-page-status"),
    pageSizeSelect: document.querySelector("#page-size-select"),
    defaultViewSelect: document.querySelector("#default-view-select"),
    settingsUnitCount: document.querySelector("#settings-unit-count"),
    settingsItemCount: document.querySelector("#settings-item-count"),
    itemDetailBack: document.querySelector("#item-detail-back"),
    itemPageArt: document.querySelector("#item-page-art"),
    itemPageId: document.querySelector("#item-page-id"),
    itemPageName: document.querySelector("#item-page-name"),
    itemPageDesc: document.querySelector("#item-page-desc"),
    itemPageTags: document.querySelector("#item-page-tags"),
    itemPageInfo: document.querySelector("#item-page-info"),
    unitDetailBack: document.querySelector("#unit-detail-back"),
    unitPageArt: document.querySelector("#unit-page-art"),
    unitPageId: document.querySelector("#unit-page-id"),
    unitPageName: document.querySelector("#unit-page-name"),
    unitPageTitle: document.querySelector("#unit-page-title"),
    unitPageTags: document.querySelector("#unit-page-tags"),
    unitPageStats: document.querySelector("#unit-page-stats"),
    unitPageSkills: document.querySelector("#unit-page-skills"),
    unitPageExtra: document.querySelector("#unit-page-extra"),
    unitPageFeskills: document.querySelector("#unit-page-feskills"),
    unitPageRawSection: document.querySelector("#unit-page-raw-section"),
    unitDetailModeSelect: document.querySelector("#unit-detail-mode-select"),
    unitDetailModeToggle: document.querySelector("#unit-detail-mode-toggle"),
    unitDetailModeLabel: document.querySelector("#unit-detail-mode-label"),
    unitPageRaw: document.querySelector("#unit-page-raw"),
    detailArt: document.querySelector("#detail-art"),
    detailId: document.querySelector("#detail-id"),
    detailName: document.querySelector("#detail-name"),
    detailTitle: document.querySelector("#detail-title"),
    detailTags: document.querySelector("#detail-tags"),
    detailStats: document.querySelector("#detail-stats"),
    detailFullPath: document.querySelector("#detail-full-path"),
    detailThumbPath: document.querySelector("#detail-thumb-path"),
    detailBattlePath: document.querySelector("#detail-battle-path")
  };

  const elementOrder = ["Fire", "Water", "Earth", "Thunder", "Light", "Dark"];
  const serverOrder = ["GL", "EU", "JP", "KR"];
  const settingsKey = "bf-db-settings";

  function normalizePageSize(value) {
    const size = Number(value);
    return [25, 50, 100, 150].includes(size) ? size : 50;
  }

  function readSettings() {
    try {
      return JSON.parse(localStorage.getItem("bf-db-settings")) || {};
    } catch (error) {
      return {};
    }
  }

  function saveSettings() {
    localStorage.setItem(settingsKey, JSON.stringify({
      pageSize: state.pageSize,
      unitDetailMode: state.unitDetailMode,
      defaultView: elements.defaultViewSelect.value
    }));
  }

  function assetPath(relativePath) {
    return `${data.imageRoot}/${relativePath}`;
  }

  function unitKey(unit) {
    return unit.key || `${unit.server || "gl"}:${unit.id}`;
  }

  function itemKey(item) {
    return item.key || `${item.server || "gl"}:${item.id}`;
  }

  function serverSlug(unit) {
    return normalize(unit.server || "gl");
  }

  function fallbackSvg(label, type) {
    const safeLabel = encodeURIComponent(label || "BF");
    const accent = type === "thumb" ? "d43d36" : "9e1118";
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 460'%3E%3Crect width='360' height='460' fill='%2309090c'/%3E%3Cpath d='M0 390 C90 320 135 440 220 360 S330 310 360 245 L360 460 L0 460Z' fill='%23${accent}' opacity='.72'/%3E%3Ccircle cx='270' cy='85' r='86' fill='%23d5a144' opacity='.22'/%3E%3Ctext x='180' y='220' fill='%23fff2e5' font-family='Arial,sans-serif' font-size='42' font-weight='700' text-anchor='middle'%3E${safeLabel}%3C/text%3E%3Ctext x='180' y='256' fill='%23d66' font-family='Arial,sans-serif' font-size='16' text-anchor='middle'%3EAdd image file%3C/text%3E%3C/svg%3E`;
  }

  function resolveImage(img, src, label, type) {
    img.onerror = function () {
      img.onerror = null;
      img.src = fallbackSvg(label, type);
    };
    img.src = assetPath(src);
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function numeric(value) {
    const match = String(value || "").match(/-?\d+/);
    return match ? Number(match[0]) : 0;
  }

  function unitMatches(unit) {
    const haystack = normalize([unit.id, unit.server, unit.name, unit.title, unit.element, unit.role, unit.rarity].join(" "));
    const queryMatch = !state.query || haystack.includes(normalize(state.query));
    const serverMatch = state.server === "all" || unit.server === state.server;
    const elementMatch = state.element === "all" || unit.element === state.element;
    const typeMatch = state.type === "all" || unit.rarity === state.type || unit.role === state.type;
    return queryMatch && serverMatch && elementMatch && typeMatch;
  }

  function itemMatches(item) {
    const haystack = normalize([item.id, item.server, item.name, item.type, item.rarity, item.desc].join(" "));
    const queryMatch = !state.query || haystack.includes(normalize(state.query));
    const serverMatch = state.server === "all" || item.server === state.server;
    const typeMatch = state.type === "all" || item.type === state.type;
    return queryMatch && serverMatch && typeMatch;
  }

  function sortEntries(entries) {
    const sorted = Array.from(entries);
    sorted.sort((a, b) => {
      if (state.sort === "id-desc") return numeric(b.id) - numeric(a.id);
      if (state.sort === "name-asc") return normalize(a.name).localeCompare(normalize(b.name));
      if (state.sort === "name-desc") return normalize(b.name).localeCompare(normalize(a.name));
      if (state.sort === "rarity-desc") return numeric(b.rarity) - numeric(a.rarity);
      if (state.sort === "rarity-asc") return numeric(a.rarity) - numeric(b.rarity);
      return numeric(a.id) - numeric(b.id);
    });
    return sorted;
  }

  function pageInfo(total, page) {
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    return {
      page: safePage,
      totalPages,
      start: (safePage - 1) * state.pageSize,
      end: safePage * state.pageSize
    };
  }

  function makeTag(text, tone) {
    const span = document.createElement("span");
    span.className = `tag ${tone || ""}`.trim();
    span.textContent = text;
    return span;
  }

  function addOptions(select, values, preferredOrder) {
    const current = select.value;
    select.replaceChildren(new Option("All", "all"));
    const ordered = preferredOrder
      ? preferredOrder.filter((value) => values.has(value)).concat(Array.from(values).filter((value) => !preferredOrder.includes(value)).sort())
      : Array.from(values).sort((a, b) => normalize(a).localeCompare(normalize(b)));
    ordered.forEach((value) => select.appendChild(new Option(value, value)));
    select.value = values.has(current) ? current : "all";
  }

  function renderFilters() {
    addOptions(elements.serverFilter, new Set([...data.units, ...data.items].map((entry) => entry.server).filter(Boolean)), serverOrder);
    addOptions(elements.elementFilter, new Set(data.units.map((unit) => unit.element).filter(Boolean)), elementOrder);
    updateTypeFilter();
  }

  function updateTypeFilter() {
    const typeValues = state.view === "items"
      ? new Set(data.items.map((item) => item.type).filter(Boolean))
      : new Set(data.units.flatMap((unit) => [unit.rarity, unit.role]).filter(Boolean));
    elements.typeFilterLabel.textContent = state.view === "items" ? "Type" : "Rarity / Role";
    addOptions(elements.typeFilter, typeValues);
    state.type = elements.typeFilter.value;
  }

  function renderUnits() {
    const matches = sortEntries(data.units.filter(unitMatches));
    const info = pageInfo(matches.length, state.pages.units);
    state.pages.units = info.page;
    const units = matches.slice(info.start, info.end);
    elements.unitGrid.replaceChildren();
    elements.unitResultSummary.textContent = `${matches.length} units found`;
    elements.unitPageStatus.textContent = `Page ${info.page} of ${info.totalPages}`;

    if (!units.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No units match that filter.";
      elements.unitGrid.appendChild(empty);
      return;
    }

    units.forEach((unit) => {
      const button = document.createElement("button");
      const key = unitKey(unit);
      button.className = `unit-card ${key === state.selectedUnitKey ? "active" : ""}`;
      button.type = "button";
      button.dataset.unitId = key;

      const thumbWrap = document.createElement("span");
      thumbWrap.className = "thumb-wrap";
      const img = document.createElement("img");
      img.alt = `${unit.name} thumbnail`;
      resolveImage(img, unit.images.thumb, unit.name, "thumb");
      thumbWrap.appendChild(img);

      const copy = document.createElement("span");
      copy.className = "unit-card-copy";
      copy.innerHTML = `<strong>${unit.name}</strong><small>${unit.title}</small>`;

      const meta = document.createElement("span");
      meta.className = "unit-card-meta";
      meta.textContent = `${unit.server || "GL"} / ${unit.element} / ${unit.rarity}`;

      button.append(thumbWrap, copy, meta);
      button.addEventListener("click", () => {
        state.selectedUnitKey = key;
        openUnitDetail(unit);
      });
      elements.unitGrid.appendChild(button);
    });
  }

  function renderDetail() {
    const unit = data.units.find((entry) => unitKey(entry) === state.selectedUnitKey) || data.units[0];
    if (!unit) return;

    resolveImage(elements.detailArt, unit.images.full, unit.name, "full");
    elements.detailId.textContent = `${unit.server || "GL"} Unit ${unit.id}`;
    elements.detailName.textContent = unit.name;
    elements.detailTitle.textContent = unit.title;
    elements.detailTags.replaceChildren(
      makeTag(unit.element, `element-${normalize(unit.element)}`),
      makeTag(unit.rarity),
      makeTag(unit.role),
      makeTag(unit.server || "GL")
    );

    elements.detailStats.replaceChildren();
    Object.entries(unit.stats || {}).forEach(([key, value]) => {
      const term = document.createElement("dt");
      term.textContent = key.toUpperCase();
      const detail = document.createElement("dd");
      detail.textContent = value;
      elements.detailStats.append(term, detail);
    });

    elements.detailFullPath.textContent = assetPath(unit.images.full);
    elements.detailThumbPath.textContent = assetPath(unit.images.thumb);
    elements.detailBattlePath.textContent = assetPath(unit.images.battle);
  }

  function renderItems() {
    elements.itemGrid.replaceChildren();
    const matches = sortEntries(data.items.filter(itemMatches));
    const info = pageInfo(matches.length, state.pages.items);
    state.pages.items = info.page;
    const items = matches.slice(info.start, info.end);
    elements.itemResultSummary.textContent = `${matches.length} items found`;
    elements.itemPageStatus.textContent = `Page ${info.page} of ${info.totalPages}`;

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No items match that filter.";
      elements.itemGrid.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = `item-card item-card--${normalize(item.type)}`;
      card.tabIndex = 0;
      const iconWrap = document.createElement("div");
      iconWrap.className = `item-icon-frame item-type-${normalize(item.type)}`;
      const img = document.createElement("img");
      img.alt = `${item.name} icon`;
      resolveImage(img, item.image, item.name, "thumb");
      iconWrap.appendChild(img);
      const copy = document.createElement("div");
      const sphereType = item.sphereTypeText || (item.sphereType !== null && item.sphereType !== undefined ? `Sphere type ${item.sphereType}` : "");
      copy.innerHTML = `
        <div class="item-card-head">
          <p class="eyebrow">${item.server || "GL"} / ${item.typeLabel || item.type} / ${item.id}</p>
          <span class="rarity-pill">${item.rarity === "8" ? "Omni" : `R${item.rarity}`}</span>
        </div>
        <h4>${item.name}</h4>
        <p>${item.desc || "No description"}</p>
        <div class="item-card-meta-row">
          <span>x${item.maxStack || 0} stack</span>
          <span>${item.sellPrice || 0} zel</span>
          ${item.effectCount ? `<span>${item.effectCount} effects</span>` : ""}
          ${item.recipeCount ? `<span>${item.recipeCount} mats</span>` : ""}
          ${sphereType ? `<span>${sphereType}</span>` : ""}
        </div>`;
      card.append(iconWrap, copy);
      card.addEventListener("click", () => openItemDetail(item));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openItemDetail(item);
        }
      });
      elements.itemGrid.appendChild(card);
    });
  }

  function compactObject(value) {
    if (Array.isArray(value)) return `${value.length} entries`;
    if (value && typeof value === "object") return Object.keys(value).length ? "Available" : "None";
    return value === undefined || value === null || value === "" ? "None" : String(value);
  }

  function detailCard(title, body, meta) {
    const article = document.createElement("article");
    article.className = "info-card";
    const heading = document.createElement("h4");
    heading.textContent = title;
    const copy = document.createElement("p");
    copy.textContent = body || "No data";
    article.append(heading, copy);
    if (meta) {
      const small = document.createElement("code");
      small.textContent = meta;
      article.appendChild(small);
    }
    return article;
  }

  function formatNumber(value) {
    const number = Number(value) || 0;
    return number.toLocaleString();
  }

  function itemTypeLabel(item = {}) {
    if (item.typeLabel) return item.typeLabel;
    if (item.type === "consumable" && !item.raid) return "Item";
    if (item.type === "material" && !item.raid) return "Material";
    if (item.type === "sphere") return "Sphere";
    if (item.type === "evomat") return "Evo Material";
    if (item.type === "summoner_consumable") return "Booster";
    if (item.raid) return "Raid Item";
    if (item.type === "ls_sphere") return "LS Sphere";
    return item.type || "Unknown";
  }

  function makeDetailSection(title, note) {
    const section = document.createElement("section");
    section.className = "item-detail-section";
    const head = document.createElement("div");
    head.className = "section-head compact-head";
    const heading = document.createElement("h3");
    heading.textContent = title;
    const copy = document.createElement("p");
    copy.textContent = note || "";
    head.append(heading, copy);
    section.appendChild(head);
    return section;
  }

  function findItemById(id, server) {
    const wantedServer = server || "GL";
    return data.items.find((item) => item.server === wantedServer && String(item.id) === String(id))
      || data.items.find((item) => String(item.id) === String(id));
  }

  function renderMiniItem(entry, count) {
    const item = entry && entry.image ? entry : findItemById(entry && entry.id, entry && entry.server);
    const article = document.createElement("article");
    article.className = "item-mini-card";
    const iconWrap = document.createElement("div");
    iconWrap.className = `item-icon-frame item-type-${normalize(item && item.type)}`;
    const img = document.createElement("img");
    img.alt = `${(item && item.name) || (entry && entry.name) || "Item"} icon`;
    resolveImage(img, item ? item.image : "items/item/item_thum_0001.png", (item && item.name) || "Item", "thumb");
    iconWrap.appendChild(img);
    const copy = document.createElement("div");
    const name = (item && item.name) || (entry && entry.name) || `Item ${entry && entry.id}`;
    copy.innerHTML = `<h4>${name}</h4><p>${itemTypeLabel(item || entry || {})}${entry && entry.id ? ` / ID ${entry.id}` : ""}</p>`;
    const amount = document.createElement("strong");
    amount.textContent = count ? `x${count}` : "View";
    article.append(iconWrap, copy, amount);
    if (item) {
      article.tabIndex = 0;
      article.addEventListener("click", () => openItemDetail(item));
      article.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openItemDetail(item);
        }
      });
    }
    return article;
  }

  function effectSummary(effect) {
    if (!effect || typeof effect !== "object") return "No effect data.";
    return Object.entries(effect)
      .slice(0, 8)
      .map(([key, value]) => `${key}: ${compactObject(value)}`)
      .join(" / ");
  }

  function renderEvolution(evolution) {
    if (!evolution) {
      return detailCard("Evolution", "No evolution data for this unit.");
    }
    const next = evolution.evo ? `${evolution.evo.name || evolution.evo.id} (${evolution.evo.rarity || "?"} Star)` : "None";
    const mats = Array.isArray(evolution.mats) && evolution.mats.length
      ? evolution.mats.map((mat) => `${mat.name || mat.id} [${mat.type || "mat"}]`).join(", ")
      : "No materials listed";
    return detailCard("Evolution", `Cost: ${evolution.amount || 0}. Evolves to: ${next}. Materials: ${mats}.`);
  }

  function renderFeSkills(feskills) {
    elements.unitPageFeskills.replaceChildren();
    if (!feskills || !Array.isArray(feskills.skills) || !feskills.skills.length) {
      elements.unitPageFeskills.appendChild(detailCard("No SP Builds", "No feskills data exists for this unit."));
      return;
    }

    const extended = state.unitDetailMode === "extended";
    const visibleSkills = extended ? feskills.skills : feskills.skills.slice(0, 6);
    const categoryNames = feskills.category || {};
    visibleSkills.forEach((entry) => {
      const skill = entry.skill || {};
      const category = categoryNames[entry.category]?.name || `Category ${entry.category || "?"}`;
      const article = document.createElement("article");
      article.className = "sp-skill-card";
      const dependency = entry.dependency || entry["dependency comment"]
        ? `<p class="sp-dependency">Requires: ${entry["dependency comment"] || entry.dependency}</p>`
        : "";
      article.innerHTML = `
        <div>
          <p class="eyebrow">${category} / ${skill.bp || 0} SP</p>
          <h4>${skill.name || entry.id || "SP Skill"}</h4>
          <p>${skill.desc || "No description"}</p>
          ${dependency}
        </div>
        <code>ID ${skill.id || entry.id || "unknown"}</code>
      `;
      elements.unitPageFeskills.appendChild(article);
    });

    if (!extended && feskills.skills.length > visibleSkills.length) {
      elements.unitPageFeskills.appendChild(detailCard("More SP Builds", String(feskills.skills.length - visibleSkills.length) + " more entries hidden. Turn on extended info to show every SP build."));
    }
  }

  function renderItemDetail(summary, raw = summary, detail = {}) {
    const item = detail.summary || summary;
    state.selectedItemKey = itemKey(item);
    resolveImage(elements.itemPageArt, item.image, item.name, "thumb");
    elements.itemPageId.textContent = `${item.server || "GL"} ${itemTypeLabel(item)} ${item.id}`;
    elements.itemPageName.textContent = item.name;
    elements.itemPageDesc.textContent = raw.desc || item.desc || "No description available.";
    elements.itemPageTags.replaceChildren(
      makeTag(item.server || "GL"),
      makeTag(itemTypeLabel(item)),
      makeTag(`Rarity ${item.rarity}`),
      makeTag(`Stack x${item.maxStack ?? raw.max_stack ?? 0}`),
      item.effectCount || detail.effects?.length ? makeTag(`${item.effectCount || detail.effects.length} effects`) : makeTag("No effects")
    );

    const general = makeDetailSection("General Info", "Core item data, stack size, value, and sphere category.");
    const generalGrid = document.createElement("div");
    generalGrid.className = "detail-card-grid";
    generalGrid.replaceChildren(
      detailCard("Database ID", item.id),
      detailCard("Type", itemTypeLabel({ ...raw, ...item })),
      detailCard("Rarity", item.rarity === "8" ? "Omni" : item.rarity),
      detailCard("Max Stack", `x${item.maxStack ?? raw.max_stack ?? 0}`),
      detailCard("Sell Price", `${formatNumber(item.sellPrice ?? raw.sell_price)} Zel`),
      detailCard("Max Equipped", raw["max equipped"] || item.maxEquipped || "No limit listed"),
      detailCard("Raid Item", raw.raid ? "Yes" : "No"),
      detailCard("Sphere Type", raw["sphere type text"] || item.sphereTypeText || (raw["sphere type"] !== undefined ? `Category ${raw["sphere type"]}` : "None"))
    );
    general.appendChild(generalGrid);

    const lore = makeDetailSection("Description and Lore", "The short game text plus dictionary lore when the source has it.");
    const loreGrid = document.createElement("div");
    loreGrid.className = "detail-card-grid";
    loreGrid.appendChild(detailCard("Description", raw.desc || item.desc || "No description available."));
    if (detail.dictionary?.lore) loreGrid.appendChild(detailCard("Lore", detail.dictionary.lore));
    lore.appendChild(loreGrid);

    const effects = makeDetailSection("Effects", "Buff and proc data shown in a readable summary, with source keys preserved.");
    const effectsList = document.createElement("div");
    effectsList.className = "effect-list";
    const loadedEffects = detail.effects || [];
    if (!loadedEffects.length) {
      effectsList.appendChild(detailCard("No Effects", "This item does not list effect data."));
    } else {
      loadedEffects.forEach((effect, index) => effectsList.appendChild(detailCard(`Effect ${index + 1}`, effectSummary(effect), JSON.stringify(effect))));
    }
    effects.appendChild(effectsList);

    const recipe = makeDetailSection("Crafting Recipe", "Materials and karma needed to craft this item.");
    const recipeList = document.createElement("div");
    recipeList.className = "material-list";
    const mats = raw.recipe && Array.isArray(raw.recipe.materials) ? raw.recipe.materials : [];
    if (!mats.length) {
      recipeList.appendChild(detailCard("Not Craftable", "This item has no recipe in the source data."));
    } else {
      mats.forEach((mat) => recipeList.appendChild(renderMiniItem({ id: String(mat.id), server: item.server }, Number(mat.count) || 0)));
      if (raw.recipe.karma) recipeList.appendChild(detailCard("Karma", `${formatNumber(raw.recipe.karma)} Karma`));
    }
    recipe.appendChild(recipeList);

    const usage = makeDetailSection("Used To Make", "Reverse recipe links generated from the item database.");
    const usageList = document.createElement("div");
    usageList.className = "material-list";
    const usageEntries = detail.usage || [];
    if (!usageEntries.length) {
      usageList.appendChild(detailCard("No Crafting Usage", "This item is not listed as a material for another item."));
    } else {
      usageEntries.slice(0, 48).forEach((entry) => usageList.appendChild(renderMiniItem({ ...entry, server: item.server }, entry.count)));
      if (usageEntries.length > 48) usageList.appendChild(detailCard("More Usage", `${usageEntries.length - 48} more linked items hidden for page speed.`));
    }
    usage.appendChild(usageList);

    const rawSection = makeDetailSection("Source Data", "Full JSON from bravefrontier_data for this item.");
    const details = document.createElement("details");
    details.className = "raw-details";
    const summaryNode = document.createElement("summary");
    summaryNode.textContent = "Show raw item JSON";
    const pre = document.createElement("pre");
    pre.className = "raw-json";
    pre.textContent = JSON.stringify(raw, null, 2);
    details.append(summaryNode, pre);
    rawSection.appendChild(details);

    elements.itemPageInfo.className = "equipment-detail-content";
    elements.itemPageInfo.replaceChildren(general, lore, effects, recipe, usage, rawSection);
  }

  async function loadItemDetail(item) {
    const key = itemKey(item);
    if (state.itemDetailCache[key]) return state.itemDetailCache[key];
    const response = await fetch(`data/item-details/${serverSlug(item)}/${item.id}.json`);
    if (!response.ok) throw new Error(`Unable to load item detail for ${key}`);
    const detail = await response.json();
    state.itemDetailCache[key] = detail;
    return detail;
  }

  async function openItemDetail(item) {
    state.lastListView = "items";
    setView("item-detail");
    elements.itemPageName.textContent = item.name;
    elements.itemPageDesc.textContent = "Loading item data...";
    elements.itemPageInfo.className = "equipment-detail-content";
    elements.itemPageInfo.replaceChildren(detailCard("Loading", "Fetching full item source entry."));
    try {
      const detail = await loadItemDetail(item);
      renderItemDetail(detail.summary || item, detail.raw || item, detail);
    } catch (error) {
      renderItemDetail(item, item, { effects: [] });
      elements.itemPageInfo.prepend(detailCard("Detail load failed", error.message));
    }
  }
  function summarizeMovement(movement) {
    if (!movement || typeof movement !== "object") return "No movement data.";
    const parts = [];
    if (movement.skill) parts.push("Skill: " + compactObject(movement.skill));
    if (movement.attack) parts.push("Attack: " + compactObject(movement.attack));
    if (movement.idle) parts.push("Idle: " + compactObject(movement.idle));
    if (!parts.length) {
      Object.entries(movement).slice(0, 4).forEach(([key, value]) => parts.push(key + ": " + compactObject(value)));
    }
    return parts.length ? parts.join(". ") : "Movement data available.";
  }

  function syncUnitDetailMode() {
    const extended = state.unitDetailMode === "extended";
    const view = document.querySelector("#unit-detail-view");
    view.classList.toggle("unit-detail-extended", extended);
    view.classList.toggle("unit-detail-simple", !extended);
    if (elements.unitPageRawSection) elements.unitPageRawSection.hidden = !extended;
    if (elements.unitDetailModeSelect) elements.unitDetailModeSelect.value = state.unitDetailMode;
    if (elements.unitDetailModeToggle) elements.unitDetailModeToggle.textContent = extended ? "Use simple view" : "Show extended info";
    if (elements.unitDetailModeLabel) elements.unitDetailModeLabel.textContent = extended ? "Extended unit page" : "Simple unit page";
  }

  function renderStatsTable(stats = {}, imp = {}) {
    const groups = Object.entries(stats).filter(([, value]) => value && typeof value === "object");
    const table = document.createElement("table");
    table.className = "detail-table";
    table.innerHTML = "<thead><tr><th>Type</th><th>HP</th><th>ATK</th><th>DEF</th><th>REC</th></tr></thead>";
    const tbody = document.createElement("tbody");
    groups.forEach(([name, values]) => {
      const row = document.createElement("tr");
      row.innerHTML = `<th>${name.replace(/^_/, "")}</th><td>${values.hp || values["hp max"] || "-"}</td><td>${values.atk || values["atk max"] || "-"}</td><td>${values.def || values["def max"] || "-"}</td><td>${values.rec || values["rec max"] || "-"}</td>`;
      tbody.appendChild(row);
    });
    if (imp && Object.keys(imp).length) {
      const row = document.createElement("tr");
      row.innerHTML = `<th>imp</th><td>${imp.max_hp || imp.hp || "-"}</td><td>${imp.max_atk || imp.atk || "-"}</td><td>${imp.max_def || imp.def || "-"}</td><td>${imp.max_rec || imp.rec || "-"}</td>`;
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    elements.unitPageStats.replaceChildren(table);
  }

  function renderUnitDetail(summary, raw, detail = {}) {
    syncUnitDetailMode();
    const extended = state.unitDetailMode === "extended";
    resolveImage(elements.unitPageArt, summary.images.full, summary.name, "full");
    elements.unitPageId.textContent = `${summary.server} Unit ${summary.id}`;
    elements.unitPageName.textContent = summary.name;
    elements.unitPageTitle.textContent = raw.desc || summary.title || "No description available.";
    elements.unitPageTags.replaceChildren(
      makeTag(summary.element, `element-${normalize(summary.element)}`),
      makeTag(summary.rarity),
      makeTag(summary.role),
      makeTag(summary.server),
      makeTag(`Cost ${summary.cost}`)
    );

    renderStatsTable(raw.stats || summary.stats, raw.imp);

    elements.unitPageSkills.replaceChildren(
      detailCard(`Leader Skill: ${raw["leader skill"]?.name || "None"}`, raw["leader skill"]?.desc, raw["leader skill"]?.id && `ID ${raw["leader skill"].id}`),
      detailCard(`Extra Skill: ${raw["extra skill"]?.name || "None"}`, raw["extra skill"]?.desc, raw["extra skill"]?.id && `ID ${raw["extra skill"].id}`),
      detailCard(`BB: ${raw.bb?.name || "None"}`, raw.bb?.desc, raw.bb?.id && `ID ${raw.bb.id}`),
      detailCard(`SBB: ${raw.sbb?.name || "None"}`, raw.sbb?.desc, raw.sbb?.id && `ID ${raw.sbb.id}`),
      detailCard(`UBB: ${raw.ubb?.name || "None"}`, raw.ubb?.desc, raw.ubb?.id && `ID ${raw.ubb.id}`)
    );

    elements.unitPageExtra.replaceChildren(
      renderEvolution(detail.evolution),
      detailCard("Movement", extended && raw.movement ? JSON.stringify(raw.movement) : summarizeMovement(raw.movement)),
      detailCard("Normal Attack", raw["damage frames"] ? `${raw["damage frames"].hits || 0} hits. Drop checks: ${raw["drop check count"] || 0}.` : "No attack frame data."),
      detailCard("Metadata", `Guide ID: ${raw.guide_id ?? "none"}. Category: ${raw.category ?? "none"}. Kind: ${raw.kind ?? "none"}. Getting type: ${raw["getting type"] ?? "none"}.`)
    );
    renderFeSkills(detail.feskills);

    elements.unitPageRaw.textContent = extended ? JSON.stringify(raw, null, 2) : "";
  }

  async function loadUnitDetail(unit) {
    const key = unitKey(unit);
    if (state.detailCache[key]) return state.detailCache[key];
    const response = await fetch(`data/unit-details/${serverSlug(unit)}/${unit.id}.json`);
    if (!response.ok) throw new Error(`Unable to load unit detail for ${key}`);
    const detail = await response.json();
    state.detailCache[key] = detail;
    return detail;
  }

  async function openUnitDetail(unit) {
    state.lastListView = state.view === "unit-detail" ? state.lastListView : state.view;
    state.selectedUnitKey = unitKey(unit);
    setView("unit-detail");
    elements.unitPageName.textContent = unit.name;
    elements.unitPageTitle.textContent = "Loading unit data...";
    elements.unitPageSkills.replaceChildren(detailCard("Loading", "Fetching full source entry."));
    try {
      const detail = await loadUnitDetail(unit);
      renderUnitDetail(detail.summary || unit, detail.raw || {}, detail);
    } catch (error) {
      renderUnitDetail(unit, { stats: unit.stats, name: unit.name });
      elements.unitPageSkills.prepend(detailCard("Detail load failed", error.message));
    }
  }

  function syncControls() {
    elements.search.value = state.query;
    elements.serverFilter.value = state.server;
    elements.elementFilter.value = state.element;
    elements.typeFilter.value = state.type;
    elements.sortSelect.value = state.sort;
    elements.pageSizeSelect.value = String(state.pageSize);
    if (elements.unitDetailModeSelect) elements.unitDetailModeSelect.value = state.unitDetailMode;
    elements.defaultViewSelect.value = savedSettings.defaultView || "units";
    syncUnitDetailMode();
  }

  function resetPages() {
    state.pages.units = 1;
    state.pages.items = 1;
  }

  function renderAll() {
    renderUnits();
    renderDetail();
    renderItems();
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll(".view").forEach((section) => section.classList.toggle("active", section.id === `${view}-view`));
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    elements.viewTitle.textContent = view === "paths" ? "Image Paths" : view === "unit-detail" ? "Unit Details" : view === "item-detail" ? "Equipment Details" : view.charAt(0).toUpperCase() + view.slice(1);
    const searchVisible = view === "units" || view === "items";
    elements.search.closest(".search-field").hidden = !searchVisible;
    elements.serverFilter.closest(".select-field").hidden = !searchVisible;
    elements.sortSelect.closest(".select-field").hidden = !searchVisible;
    elements.typeFilter.closest(".select-field").hidden = !searchVisible;
    elements.clearFilters.hidden = !searchVisible;
    elements.elementFilter.closest(".select-field").hidden = view !== "units";
    elements.search.placeholder = view === "items" ? "Name, type, server, id" : "Name, element, rarity, server, id";
    updateTypeFilter();
    renderAll();
  }

  function changePage(kind, direction) {
    state.pages[kind] += direction;
    if (kind === "units") renderUnits();
    if (kind === "items") renderItems();
  }

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.querySelectorAll(".pager").forEach((pager) => {
    pager.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-page-action]");
      if (!button) return;
      changePage(pager.dataset.pager, button.dataset.pageAction === "next" ? 1 : -1);
    });
  });

  elements.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    resetPages();
    renderAll();
  });

  elements.serverFilter.addEventListener("change", (event) => {
    state.server = event.target.value;
    resetPages();
    renderAll();
  });

  elements.elementFilter.addEventListener("change", (event) => {
    state.element = event.target.value;
    resetPages();
    renderUnits();
  });

  elements.typeFilter.addEventListener("change", (event) => {
    state.type = event.target.value;
    resetPages();
    renderAll();
  });

  elements.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    resetPages();
    renderAll();
  });

  elements.clearFilters.addEventListener("click", () => {
    state.query = "";
    state.server = "GL";
    state.element = "all";
    state.type = "all";
    state.sort = "id-asc";
    resetPages();
    syncControls();
    renderAll();
  });

  elements.pageSizeSelect.addEventListener("change", (event) => {
    state.pageSize = normalizePageSize(event.target.value);
    resetPages();
    saveSettings();
    renderAll();
  });

  elements.defaultViewSelect.addEventListener("change", saveSettings);
  elements.unitDetailModeSelect.addEventListener("change", (event) => {
    state.unitDetailMode = event.target.value === "extended" ? "extended" : "simple";
    saveSettings();
    const unit = data.units.find((entry) => unitKey(entry) === state.selectedUnitKey);
    if (state.view === "unit-detail" && unit) openUnitDetail(unit);
    else syncUnitDetailMode();
  });
  elements.unitDetailModeToggle.addEventListener("click", () => {
    state.unitDetailMode = state.unitDetailMode === "extended" ? "simple" : "extended";
    saveSettings();
    const unit = data.units.find((entry) => unitKey(entry) === state.selectedUnitKey);
    if (unit) openUnitDetail(unit);
    else syncUnitDetailMode();
  });
  elements.unitDetailBack.addEventListener("click", () => setView(state.lastListView || "units"));
  elements.itemDetailBack.addEventListener("click", () => setView("items"));

  elements.unitCount.textContent = data.units.length;
  elements.itemCount.textContent = data.items.length;
  elements.settingsUnitCount.textContent = data.units.length;
  elements.settingsItemCount.textContent = data.items.length;
  renderFilters();
  syncControls();
  setView(state.view);
}());
