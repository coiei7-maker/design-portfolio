import json
from html import escape
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
PROJECTS = json.loads((ROOT / "projects.json").read_text(encoding="utf-8"))
STAGES = {"graduate": "研究生", "undergraduate": "本科", "engineering": "工程设计"}
TOOLS = [
    ("figma", "Figma"),
    ("rhino", "Rhino"),
    ("visio", "Visio"),
    ("excel", "Excel"),
    ("photoshop", "Photoshop"),
    ("solidworks", "SOLIDWORKS"),
    ("xmind", "Xmind"),
    ("keyshot", "KeyShot"),
    ("autocad", "AutoCAD"),
    ("premierepro", "Premiere Pro"),
    ("notion", "Notion"),
    ("spss", "IBM SPSS Statistics"),
    ("chatgpt", "ChatGPT"),
    ("illustrator", "Illustrator"),
    ("blender", "Blender"),
    ("aftereffects", "After Effects"),
    ("indesign", "InDesign"),
    ("miro", "Miro"),
    ("obsidian", "Obsidian"),
    ("claude", "Claude"),
    ("perplexity", "Perplexity"),
    ("powerbi", "Power BI"),
    ("python", "Python"),
    ("r", "R"),
]


def layout(title, description, content, home=False):
    home_assets = '\n  <link rel="stylesheet" href="home.css">\n  <script src="magazines.js" defer></script>' if home else ""
    header = "" if home else """
  <header class="shell header">
    <a class="identity" href="index.html">Guofeng.Zhang</a>
    <nav aria-label="主导航">
      <a href="index.html#work">作品</a>
      <a href="index.html#about">关于我</a>
    </nav>
  </header>"""
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{escape(description)}">
  <meta name="theme-color" content="#efefed">
  <title>{escape(title)}</title>
  <link rel="icon" href="assets/icon.png" type="image/png">
  <link rel="stylesheet" href="style.css">{home_assets}
  <script src="site.js" defer></script>
</head>
<body>
  <a class="skip" href="#main">跳到主要内容</a>
  {header}
  {content}
  <footer class="shell footer"><span>© 张国凤</span><a href="#main">回到顶部 ↑</a></footer>
</body>
</html>
"""


def project_image(project, loading="lazy"):
    slug = project["slug"]
    if slug == "aed-research":
        return '<div class="aed-art" aria-hidden="true"><span>AED</span><i></i></div>'
    priority = ' fetchpriority="high"' if loading == "eager" else ""
    asset = project.get("cover", slug)
    alt = f'{project["title"]}的原始作品集封面' if "cover" in project else ""
    return f'<img src="assets/{asset}.webp" alt="{escape(alt)}" loading="{loading}"{priority} decoding="async">'


def magazine_cover(project):
    slug = project["slug"]
    if "cover" in project:
        return f'<div class="magazine-cover source-cover" data-cover="{slug}">{project_image(project)}</div>'
    stage = STAGES[project["stage"]]
    return f"""
      <div class="magazine-cover" data-cover="{slug}">
        <div class="cover-image">{project_image(project)}</div>
        <div class="magazine-masthead"><span>Guofeng.Zhang</span><span>{stage}</span></div>
        <div class="magazine-title">
          <strong>{project["title"]}</strong><span>{project["en"]}</span>
        </div>
      </div>"""


def shelf_item(project):
    slug, stage = project["slug"], project["stage"]
    return f"""<a class="shelf-item" data-stage="{stage}" data-magazine="{slug}"
                href="{slug}.html" aria-label="{project["title"]}">
          {magazine_cover(project)}
        </a>"""


def magazine_overview(project):
    notes = []
    for index, (label, paragraph) in enumerate(project["sections"]):
        heading = "<h3>设计过程</h3>" if index == 0 else ""
        notes.append(f'<div class="paper-leaf">{heading}<h4>{label}</h4><p>{paragraph}</p></div>')
    meta = "".join(f"<div><dt>{label}</dt><dd>{value}</dd></div>" for label, value in project.get("meta", []))
    flow = "".join(f"<li>{step}</li>" for step in project.get("flow", []))
    flow_page = f'<article class="paper paper-flow" data-page-label="研究流程"><h3>研究流程</h3><ol>{flow}</ol></article>' if flow else ""
    return f"""
      <article class="paper paper-opening" data-page-label="项目概览">
        <div class="paper-leaf">
          <p class="paper-category">{STAGES[project["stage"]]} · {project["type"]}</p>
          <h3>{project["title"]}</h3>
        </div>
        <div class="paper-leaf">
          <p class="paper-intro">{project["intro"]}</p>
          {f'<dl>{meta}</dl>' if meta else ""}
        </div>
      </article>
      <article class="paper paper-notes" data-page-label="设计过程">
        {"".join(notes)}
      </article>
      {flow_page}"""


def magazine(project):
    overview = "" if project.get("source_spreads") else magazine_overview(project)
    images = []
    for label, asset in project["media"]:
        path = f"assets/{asset}.webp"
        images.append(f"""<figure class="paper paper-image" data-page-label="{label}">
          <a href="{path}" target="_blank" rel="noopener" aria-label="在新标签页查看原图：{label}">
            <img src="{path}" alt="{label}" decoding="async">
          </a>
        </figure>""")
    return f"""<template id="magazine-{project["slug"]}">
      <article class="paper paper-cover" data-page-label="封面">{magazine_cover(project)}</article>
      {overview}
      {"".join(images)}
    </template>"""


def bookshelf():
    first = PROJECTS[0]
    return f"""
    <section class="shell work profile-section" id="work" aria-labelledby="work-title">
      <div class="work-head" data-reveal>
        <div><p class="section-label">Selected work</p><h2 id="work-title">作品书架</h2></div>
        <div class="filters" role="group" aria-label="筛选项目" hidden>
          <button type="button" data-filter="all" aria-pressed="true">全部</button>
          <button type="button" data-filter="graduate" aria-pressed="false">研究生</button>
          <button type="button" data-filter="undergraduate" aria-pressed="false">本科</button>
          <button type="button" data-filter="engineering" aria-pressed="false">工程设计</button>
        </div>
      </div>
      <div class="shelf-heading">
        <p>点选杂志封面，在桌面翻阅。<span>封面 420 × 297 mm · 跨页 840 × 297 mm</span></p>
        <div class="shelf-nav" hidden>
          <button type="button" data-shelf-direction="-1" aria-label="向左浏览书架">←</button>
          <button type="button" data-shelf-direction="1" aria-label="向右浏览书架">→</button>
        </div>
      </div>
      <div class="shelf" aria-label="作品杂志">
        {''.join(shelf_item(project) for project in PROJECTS)}
      </div>
      <div class="shelf-edge" aria-hidden="true"></div>
      <p class="sr-only" aria-live="polite" id="filter-status"></p>
      <section class="desk" id="desk" aria-label="杂志阅读桌面" tabindex="-1" hidden>
        <div class="desk-head">
          <h3 class="desk-title">{first["title"]}</h3>
          <div class="desk-links"><a class="desk-back" href="#work">回到书架 ↑</a><a class="desk-details" href="{first["slug"]}.html">项目详情 ↗</a></div>
        </div>
        <div class="desk-frame">
          <div class="desk-book">
            <article class="paper paper-cover" data-page-label="封面">{magazine_cover(first)}</article>
          </div>
        </div>
        <div class="desk-controls" role="group" aria-label="翻页控制">
          <button type="button" class="desk-prev" aria-label="上一页">←</button>
          <button type="button" class="desk-play">开始翻阅</button>
          <button type="button" class="desk-next" aria-label="下一页">→</button>
          <p class="desk-page" aria-label="当前页码"></p>
        </div>
        <div class="desk-index" role="group" aria-label="跳转到指定页"></div>
      </section>
      {''.join(magazine(project) for project in PROJECTS)}
    </section>"""


def tool_icon(slug, name):
    if slug == "autocad":
        graphic = '<span class="tool-dock-cad" aria-hidden="true">CAD</span>'
    else:
        graphic = f'<img src="assets/tools/{slug}.png" alt="" width="128" height="128" loading="lazy" decoding="async">'
    return f"""<li class="tool-dock-item">
          <button type="button" class="tool-dock-button" aria-label="{escape(name)}" aria-pressed="false">{graphic}</button>
          <span class="tool-dock-name" aria-hidden="true">{escape(name)}</span>
        </li>"""


def profile():
    tools = "".join(tool_icon(slug, name) for slug, name in TOOLS)
    return f"""
    <section class="shell profile-section experience" id="experience" aria-labelledby="experience-title">
      <div class="profile-heading" data-reveal>
        <p class="section-label">Career experience</p><h2 id="experience-title">工作经历</h2>
      </div>
      <div class="experience-list">
        <article class="experience-entry" data-reveal>
          <div><p class="experience-date">2025.06 – 2025.08 · 实习</p><h3>产品设计助理</h3><p>天津瑞利通科技有限公司</p></div>
          <p>调研工业控制机箱竞品，深化 3 套外观方案。配合结构团队调整面板、散热与工艺细节，参与零件建模、装配图和 BOM 整理。</p>
        </article>
        <article class="experience-entry" data-reveal>
          <div><p class="experience-date">2024.06 – 2024.08 · 实习</p><h3>产品运营</h3><p>济南笑开研教育科技有限公司</p></div>
          <p>从零搭建考研教育 B 站账号，负责选题、制作与发布，并参与小红书账号定位与引流。</p>
        </article>
        <article class="experience-entry" data-reveal>
          <div><p class="experience-date">2022.09 – 2023.08</p><h3>产品设计</h3><p>山东昊研电子科技有限公司</p></div>
          <p>设计建筑设备的注塑件与钣金件，优化楼层呼叫机和警示灯的装配流程。在既有帽体模具约束下，改进智能安全帽的连接与内部布局。</p>
        </article>
      </div>
    </section>
    <section class="shell profile-section about" id="about" aria-labelledby="about-title" data-reveal>
      <div class="about-intro">
        <p class="section-label">About &amp; education</p><h2 id="about-title">关于我</h2>
        <p>我的研究关注用户研究、包容性设计与 TRIZ 方法。工业设计和工程训练让我能够同时考虑使用需求、产品表达与装配约束。</p>
      </div>
      <div class="education">
        <div><p class="experience-date">2024.09 – 2027.06</p><h3>河北工业大学</h3><p>工业设计工程 · 硕士</p></div>
        <div><p class="experience-date">2018.09 – 2022.06</p><h3>齐鲁工业大学</h3><p>工业设计 · 本科</p></div>
      </div>
    </section>
    <section class="shell profile-section" id="tools" aria-labelledby="tools-title">
      <div class="profile-heading" data-reveal>
        <p class="section-label">Tools &amp; capabilities</p><h2 id="tools-title">工具与功能</h2>
      </div>
      <ul class="tool-dock" aria-label="软件图标">{tools}</ul>
    </section>"""


def process():
    steps = [
        ("观察使用场景", "观察真实或模拟任务，记录用户行为与环境约束。", "归纳去标识化的观察笔记，列出待核实的问题。"),
        ("把发现转成需求", "回看原始记录，确认受阻环节并排定需求优先级。", "提出不同的归类和解释，帮助检查是否遗漏了线索。"),
        ("推演并表达方案", "设定设计目标，比较草图与原型，选择值得深化的方案。", "发散备选方向、使用情境和表达方式，供我比较。"),
        ("检查可用性与装配", "通过任务测试、尺寸核查和装配检查决定如何迭代。", "协助准备测试清单、整理反馈和比对各轮修改。"),
    ]
    cards = "".join(
        f"""<li data-reveal>
          <h3>{title}</h3>
          <dl><div><dt>人</dt><dd>{human}</dd></div><div><dt>AI</dt><dd>{ai}</dd></div></dl>
        </li>"""
        for title, human, ai in steps
    )
    return f"""
    <section class="shell profile-section process" id="process" aria-labelledby="process-title">
      <div class="profile-heading" data-reveal>
        <p class="section-label">How I work</p><h2 id="process-title">工作方式</h2>
        <p class="process-intro">我负责定义问题、核对证据并作出设计判断。AI 协助整理材料、拓展备选方案和准备验证。</p>
      </div>
      <ol class="process-list">{cards}</ol>
    </section>"""


def homepage():
    return layout("张国凤｜工业设计作品集", "张国凤的工业设计作品集，收录本科与研究生阶段的项目及工程设计方案。", f"""
  <main id="main">
    <section class="cover" aria-labelledby="cover-title">
      <div class="cover-header">
        <h1 id="cover-title" aria-label="张国凤 · Guofeng Zhang">Guofeng.Zhang</h1>
        <p class="cover-intro">我是张国凤。这里收录我的工业设计、交互设计和研究作品。</p>
        <nav class="cover-nav" aria-label="主导航">
          <a href="#work"><span>Works <small>作品</small></span><span aria-hidden="true">↗</span></a>
          <a href="#experience"><span>Experience <small>工作经历</small></span><span aria-hidden="true">↗</span></a>
          <a href="#about"><span>About <small>关于我</small></span><span aria-hidden="true">↗</span></a>
        </nav>
      </div>
      <div class="cover-art">
        <div class="cover-shapes" aria-hidden="true">
          <i class="dot dot-first"></i><i class="dot dot-second"></i>
          <i class="glyph glyph-green"></i><i class="glyph glyph-blue"></i><i class="glyph glyph-yellow"></i>
          <img class="cover-figure" src="assets/designer-illustration.webp" width="423" height="1160" alt="" fetchpriority="high">
        </div>
        <div class="cover-palettes" role="group" aria-label="封面配色" hidden>
          <span>配色</span>
          <button type="button" data-palette="primary" aria-label="经典配色" aria-pressed="true" title="经典"></button>
          <button type="button" data-palette="berry" aria-label="莓果配色" aria-pressed="false" title="莓果"></button>
          <button type="button" data-palette="sea" aria-label="海盐配色" aria-pressed="false" title="海盐"></button>
        </div>
        <a class="cover-cta" href="#work"><span>Explore<br>the work<small>浏览作品</small></span><span class="cover-arrow" aria-hidden="true">→</span></a>
      </div>
    </section>
    {profile()}
    {bookshelf()}
    {process()}
  </main>""", home=True)


def gallery(project):
    if not project["media"]:
        return ""
    figures = []
    for label, asset in project["media"]:
        path = f"assets/{asset}.webp"
        figures.append(f"""<figure data-reveal>
          <a class="figure-link" href="{path}" target="_blank" rel="noopener" aria-label="查看大图：{label}">
            <img src="{path}" alt="{label}" loading="lazy" decoding="async">
            <span aria-hidden="true">↗</span>
          </a>
          <figcaption>{label}</figcaption>
        </figure>""")
    first_label, first_asset = project["media"][0]
    return f"""
        <section class="gallery" id="gallery" aria-labelledby="gallery-title">
          <h2 id="gallery-title">项目图稿</h2>
          {"".join(figures)}
        </section>
        <dialog class="lightbox" aria-label="项目图稿大图">
          <div class="lightbox-bar">
            <p class="lightbox-caption" aria-live="polite"></p>
            <button type="button" class="lightbox-close" aria-label="关闭大图" autofocus>×</button>
          </div>
          <img class="lightbox-image" src="assets/{first_asset}.webp" alt="{first_label}" loading="lazy">
          <div class="lightbox-bar lightbox-controls">
            <button type="button" class="lightbox-prev" aria-label="上一张">←</button>
            <a class="lightbox-original" href="assets/{first_asset}.webp" target="_blank" rel="noopener">在新标签页打开原图 ↗</a>
            <button type="button" class="lightbox-next" aria-label="下一张">→</button>
          </div>
        </dialog>"""


def detail(project, next_project):
    stage, title = project["stage"], project["title"]
    cover_attributes = f'class="detail-cover source-cover" data-cover="{project["slug"]}"' if "cover" in project else 'class="detail-cover"'
    meta = "".join(f"<div><dt>{label}</dt><dd>{value}</dd></div>" for label, value in project.get("meta", []))
    notes = "".join(f"<section><h3>{label}</h3><p>{paragraph}</p></section>" for label, paragraph in project["sections"])
    flow = "".join(f"<li>{step}</li>" for step in project.get("flow", []))
    contents_link = '<a href="#gallery">项目图稿 <span aria-hidden="true">↓</span></a>' if project["media"] else '<a href="#research-flow">研究流程 <span aria-hidden="true">↓</span></a>'
    return layout(f"{title}｜张国凤作品集", project["intro"], f"""
  <main id="main" class="shell detail">
    <a class="back" href="index.html?stage={stage}#work">← 返回{STAGES[stage]}作品</a>
    <div class="detail-head">
      <div>
        <p class="section-label">{STAGES[stage]} · {project["type"]}</p>
        <h1>{title}</h1>
        <p class="detail-english">{project["en"]}</p>
      </div>
      <p class="detail-intro">{project["intro"]}</p>
    </div>
    <div {cover_attributes} data-stage="{stage}">{project_image(project, "eager")}</div>
    <div class="case-layout">
      <nav class="case-nav" aria-label="项目内导航">
        <a href="#overview">项目概览 <span aria-hidden="true">↓</span></a>
        {contents_link}
      </nav>
      <div class="case-body">
        <section class="overview" id="overview" data-reveal>
          <h2>项目概览</h2>
          {f'<dl class="detail-meta">{meta}</dl>' if meta else ""}
          <div class="notes">{notes}</div>
        </section>
        {f'<section id="research-flow" class="research-flow" data-reveal><h2>研究流程</h2><ol>{flow}</ol></section>' if flow else ""}
        {gallery(project)}
      </div>
    </div>
    <a class="next" href="{next_project["slug"]}.html" data-reveal><span>下一项目<strong>{next_project["title"]}</strong></span><span class="next-arrow" aria-hidden="true">↗</span></a>
  </main>""")


DIST.mkdir(exist_ok=True)
home_html = "\n".join(line.rstrip() for line in homepage().splitlines()) + "\n"
(DIST / "index.html").write_text(home_html, encoding="utf-8")
for index, project in enumerate(PROJECTS):
    next_project = PROJECTS[(index + 1) % len(PROJECTS)]
    (DIST / f'{project["slug"]}.html').write_text(detail(project, next_project), encoding="utf-8")

