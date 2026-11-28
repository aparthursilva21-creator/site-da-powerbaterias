"""Testa o site estático em Chromium via Playwright, usando uma URL já servida."""
import os
import re
import sys
from pathlib import Path
from urllib.parse import parse_qs, unquote, urljoin, urlsplit

from playwright.sync_api import expect, sync_playwright


OFFLINE_BASE = "https://power-test.invalid/site-da-powerbaterias/"
DIST = Path(__file__).resolve().parents[1] / "dist"
MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".glb": "model/gltf-binary",
}
WIDTHS = (320, 375, 390, 430, 768, 1024, 1440, 1920, 2560)
ROUTES = (
    "",
    "power-garage.html",
    "baterias.html",
    "produto.html",
    "power-sos.html",
    "servicos.html",
    "sobre.html",
    "conteudos.html",
    "artigo.html",
    "contato.html",
    "privacidade.html",
    "termos.html",
    "garantias.html",
    "cookies.html",
    "404.html",
)


def install_offline_fixture(context):
    origin = urlsplit(OFFLINE_BASE)

    def serve(route):
        url = urlsplit(route.request.url)
        if url.netloc != origin.netloc:
            route.abort()
            return
        # Preserve subdirectory semantics and the custom 404 when a path is absent.
        path = unquote(url.path).removeprefix(origin.path)
        target = (DIST / (path or "index.html")).resolve()
        status = 200
        if not target.is_relative_to(DIST) or not target.is_file():
            target = DIST / "404.html"
            status = 404
        route.fulfill(status=status, path=str(target), content_type=MIME.get(target.suffix))

    context.route("**/*", serve)


def test_responsive(page, base):
    for route in ROUTES:
        page.set_viewport_size({"width": WIDTHS[0], "height": 900})
        page.goto(urljoin(base, route), wait_until="networkidle")
        expect(page.locator("main h1")).to_be_visible()
        for width in WIDTHS:
            page.set_viewport_size({"width": width, "height": 900})
            overflow = page.evaluate(
                "() => document.documentElement.scrollWidth - document.documentElement.clientWidth"
            )
            assert overflow <= 1, f"{route or 'index.html'} tem overflow de {overflow}px a {width}px"


def test_without_javascript(browser, base, offline):
    context = browser.new_context(java_script_enabled=False, viewport={"width": 390, "height": 844})
    if offline:
        install_offline_fixture(context)
    page = context.new_page()
    page.goto(base)
    expect(page.locator("main h1")).to_be_visible()
    expect(page.get_by_role("link", name="Encontrar minha bateria")).to_be_visible()
    summary = page.locator("[data-menu]")
    summary.focus()
    page.keyboard.press("Enter")
    services = page.locator(".site-mobile-nav").get_by_role("link", name="Serviços")
    expect(services).to_be_visible()
    services.focus()
    page.keyboard.press("Enter")
    expect(page).to_have_url(re.compile(r"/servicos\.html$"))
    page.goto(urljoin(base, "power-garage.html"))
    expect(page.locator("[data-viewer-poster]")).to_be_visible()
    page.goto(urljoin(base, "baterias.html"))
    expect(page.locator("[data-catalog-product]").first).to_be_visible()
    context.close()


def test_sos(context, page, base):
    def intercept(route):
        route.fulfill(status=200, content_type="text/plain", body="WhatsApp interceptado pelo teste")

    context.route("https://wa.me/**", intercept)
    context.set_geolocation({"latitude": -15.8732, "longitude": -48.0868})
    context.grant_permissions(["geolocation"])
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(urljoin(base, "power-sos.html"))
    expect(page.locator("iframe")).to_have_count(0)
    page.locator("#sos-name").fill("Pessoa Teste")
    page.locator("#sos-vehicle").fill("Veículo de QA")
    page.locator("#sos-year").fill("2020")
    page.locator("#sos-description").fill("Motor não dá partida & painel acende")
    page.locator("[data-locate]").click()
    expect(page.locator("[data-location-status]")).to_contain_text("Localização aproximada incluída")
    expect(page.locator("[data-remove-location]")).to_be_visible()
    page.locator("[data-remove-location]").click()
    expect(page.locator("[data-remove-location]")).to_be_hidden()

    submit = page.locator("[data-sos-form] button[type=submit]")
    with context.expect_page() as popup_info:
        submit.click()
    popup = popup_info.value
    popup.wait_for_load_state()
    payload = urlsplit(popup.url)
    assert payload.hostname == "wa.me" and payload.path == "/5561995191090", popup.url
    message = parse_qs(payload.query)["text"][0]
    assert "Veículo de QA" in message and "painel acende" in message, message
    assert "-15.873" not in message and "-48.087" not in message, message
    popup.close()

    page.evaluate("""() => {
        Object.defineProperty(navigator, 'geolocation', {
            configurable: true,
            value: { getCurrentPosition(_success, fail) { fail({ code: 1 }); } }
        });
    }""")
    page.locator("[data-locate]").click()
    expect(page.locator("[data-location-status]")).to_contain_text("Permissão de localização negada")
    expect(submit).to_be_enabled()


def test_on_demand_map(context, page, base):
    maps_url = re.compile(r"^https://(?:www\.google\.com/maps|maps\.google\.com/maps)")
    context.route(maps_url, lambda route: route.fulfill(status=200, body="Mapa interceptado"))
    page.goto(urljoin(base, "contato.html"))
    expect(page.locator("iframe")).to_have_count(0)
    page.locator("[data-load-map]").click()
    expect(page.locator("iframe")).to_have_count(1)
    expect(page.locator("iframe")).to_have_attribute("src", maps_url)
    page.locator("[data-load-map]").click()
    expect(page.locator("iframe")).to_have_count(0)



def test_not_found(context, base):
    page = context.new_page()
    path = urljoin(base, "rota-ausente/subpagina")
    response = page.goto(path)
    assert response.status == 404
    expect(page.locator("main h1")).to_have_text("Página não encontrada")
    page.keyboard.press("Tab")
    skip = page.get_by_role("link", name=re.compile(r"pular", re.I))
    expect(skip).to_be_focused()
    page.keyboard.press("Enter")
    expect(page).to_have_url(path + "#conteudo")
    page.get_by_role("link", name="Voltar ao início").click()
    expect(page).to_have_url(base)
    page.close()


def test_navigation(page, base):
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(base)
    page.keyboard.press("Tab")
    expect(page.get_by_role("link", name=re.compile(r"pular", re.I))).to_be_focused()
    menu = page.locator("[data-menu]")
    menu.focus()
    page.keyboard.press("Enter")
    expect(menu).to_have_attribute("aria-expanded", "true")
    page.keyboard.press("Escape")
    expect(menu).to_have_attribute("aria-expanded", "false")
    expect(menu).to_be_focused()
    menu.click()
    page.locator(".site-mobile-nav").get_by_role("link", name="Power Garage").click()
    expect(page).to_have_url(re.compile(r"/power-garage\.html$"))
    expect(page.locator("[data-menu]")).to_have_attribute("aria-expanded", "false")

    page.set_viewport_size({"width": 1440, "height": 900})
    expect(page.locator(".site-nav")).to_be_visible()
    expect(page.locator("[data-menu]")).to_be_hidden()


def test_battery_education(page, base):
    page.goto(base)
    section = page.locator("[data-battery]")
    section.get_by_text("Terminais e tampa", exact=True).click()
    expect(section.get_by_text("Os polos positivo", exact=False)).to_be_visible()
    load = section.locator("[data-battery-load]")
    webgl = page.evaluate("() => Boolean(document.createElement('canvas').getContext('webgl2'))")
    load.click()
    slider = section.get_by_role("slider", name="Separação das peças")
    if webgl:
        expect(slider).to_be_visible(timeout=20000)
        slider.focus()
        page.keyboard.press("End")
        expect(slider).to_have_value("100")
        expect(section.locator("[data-battery-scroll]")).to_be_hidden()
    else:
        expect(section.locator(".battery-poster")).to_be_visible()
        expect(section.locator(".battery-status")).to_contain_text("indisponível")


def test_catalog(page, base):
    page.goto(urljoin(base, "baterias.html"))
    search = page.locator("#catalog-search")
    search.fill("Moura mf60ad")
    expect(page.locator("[data-catalog-product]:visible")).to_have_count(1)
    page.locator("#catalog-filter-technology").select_option("AGM")
    expect(page.locator("[data-catalog-empty]")).to_be_visible()
    page.locator("[data-catalog-reset]").click()
    expect(search).to_have_value("")
    search.fill("mf60ad")
    page.locator("[data-catalog-product]:visible").get_by_role("link", name="Ver detalhes de Moura MF60AD").click()
    expect(page).to_have_url(re.compile(r"/produto-moura-mf60ad\.html$"))
    expect(page.locator("main h1")).to_contain_text("MF60AD")


def test_garage(context, page, base):
    page.goto(urljoin(base, "power-garage.html"))
    form = page.locator("#garage-consulta")
    expect(form).to_be_visible()
    expect(form.locator("[name=brand]")).to_be_disabled()

    def select(field, value):
        form.locator(f"[name={field}]").select_option(value)

    select("type", "SUV")
    select("brand", "Chevrolet")
    select("model", "Tracker")
    select("year", "2023")
    select("engine", "1.0 Turbo")
    select("version", "LT automático")
    select("startStop", "sim")
    select("product", "moura-mf60ad")
    form.locator("button[type=submit]").click()
    result = page.locator("#garage-result")
    expect(result).to_have_attribute("data-status", "compatible")
    expect(result).to_contain_text("Tracker")
    href = result.locator("a[href^='https://wa.me/']").first.get_attribute("href")
    message = parse_qs(urlsplit(href).query)["text"][0]
    assert "Tracker" in message and "MF60AD" in message, message

    select("product", "heliar-hefb60hd")
    form.locator("button[type=submit]").click()
    expect(result).to_have_attribute("data-status", "confirm")

    select("product", "moura-m60gd")
    form.locator("button[type=submit]").click()
    expect(result).to_have_attribute("data-status", "incompatible")
    select("type", "Caminhão")
    expect(form.locator("[name=model]")).to_have_value("")
    expect(result).to_be_hidden()
    form.locator("button[type=submit]").click()
    expect(result).to_have_attribute("data-status", "unknown")

    start = page.locator("[data-viewer-start]")
    if page.evaluate("() => Boolean(document.createElement('canvas').getContext('webgl2'))"):
        start.click()
        expect(page.locator("[data-viewer-reset]")).to_be_visible(timeout=20000)
        hood = page.locator("[data-viewer-hood]")
        if hood.is_visible():
            hood.click()
            expect(hood).to_have_attribute("aria-expanded", "true")
            page.locator("[data-viewer-install]").click()
            expect(page.locator("[data-viewer-status]")).to_contain_text("Demonstração ilustrativa concluída")
        page.locator("[data-viewer-reset]").click()
        if hood.is_visible():
            expect(hood).to_have_attribute("aria-expanded", "false")
        print("Power Garage: visualização GLB, capô ilustrativo e redefinição da câmera.")
    else:
        expect(page.locator("[data-viewer-poster]")).to_be_visible()
        print("Power Garage: visualização estática em navegador sem WebGL2.")

    pattern = "**/assets/models/*.glb"
    context.route(pattern, lambda route: route.abort())
    page.goto(urljoin(base, "power-garage.html"))
    if start.is_visible():
        start.click()
        expect(page.locator("[data-viewer-status]")).to_contain_text("continua disponível")
    expect(page.locator("[data-viewer-poster]")).to_be_visible()
    expect(page.locator("#garage-consulta")).to_be_visible()
    context.unroute(pattern)


def audit_accessibility(page, base, script):
    axe = Path(script).read_text(encoding="utf-8")
    violations = []
    for route in ROUTES:
        page.goto(urljoin(base, route))
        page.evaluate(axe)
        problems = page.evaluate("""async () => {
            const results = await axe.run({
                runOnly: {
                    type: 'tag',
                    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
                }
            });
            return results.violations.map(({ id, nodes }) => [id, nodes.map(({ target }) => target)]);
        }""")
        violations.extend((route or "index.html", problem) for problem in problems)
    assert not violations, "\n".join(str(violation) for violation in violations)
    print(f"axe-core: {len(ROUTES)} rotas, sem violações detectadas pelas regras automatizadas executadas.")


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Uso: python tests/browser_smoke.py --offline ou http://localhost:3000/")
    offline = sys.argv[1] == "--offline"
    if offline and not (DIST / "index.html").is_file():
        raise SystemExit("Execute npm run build antes da validação offline.")
    base = OFFLINE_BASE if offline else sys.argv[1].rstrip("/") + "/"
    origin = urlsplit(base).netloc
    with sync_playwright() as playwright:
        flags = ["--no-proxy-server", "--host-resolver-rules=MAP * ~NOTFOUND"] if offline else []
        browser = playwright.chromium.launch(executable_path=os.getenv("CHROMIUM_EXECUTABLE"), args=flags)
        context = browser.new_context(reduced_motion="reduce")
        if offline:
            install_offline_fixture(context)
        page = context.new_page()
        errors = []
        bad_requests = []
        page.on("pageerror", lambda err: errors.append(str(err)))
        page.on(
            "response",
            lambda response: bad_requests.append((response.status, response.url))
            if response.status >= 400
            and urlsplit(response.url).netloc == origin
            and not urlsplit(response.url).path.endswith("/404.html")
            else None,
        )

        assert page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
        test_responsive(page, base)
        print(f"Layout Chromium: {len(ROUTES)} rotas × {len(WIDTHS)} larguras.")
        test_navigation(page, base)
        test_battery_education(page, base)
        test_catalog(page, base)
        test_garage(context, page, base)
        test_sos(context, page, base)
        test_on_demand_map(context, page, base)
        test_without_javascript(browser, base, offline)
        test_not_found(context, base)
        assert not errors, errors
        assert not bad_requests, bad_requests
        if axe_script := os.getenv("AXE_JS"):
            page.set_viewport_size({"width": 1440, "height": 900})
            audit_accessibility(page, base, axe_script)
        if screenshots := os.getenv("POWER_SCREENSHOTS"):
            for size, name in (((1440, 900), "desktop"), ((390, 844), "mobile")):
                page.set_viewport_size({"width": size[0], "height": size[1]})
                page.goto(base, wait_until="networkidle")
                page.screenshot(path=str(Path(screenshots) / f"power-{name}.png"))
        browser.close()
    print(f"Chromium: {len(ROUTES)} rotas e {len(WIDTHS)} larguras; formulário SOS, geolocalização e mapa sob demanda.")


if __name__ == "__main__":
    main()
