import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="privacy-wrapper">
      <div class="privacy-container">
        <header class="privacy-header">
          <button mat-icon-button routerLink="/" aria-label="Wróć do aplikacji">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>Polityka Prywatności</h1>
        </header>

        <p class="update-date">Ostatnia aktualizacja: 26 stycznia 2026 r.</p>

        <main class="privacy-content">
          <p>
            Aplikacja <strong>Parkowanko</strong> (dalej: "Aplikacja") dba o prywatność swoich
            użytkowników. Niniejszy dokument opisuje, jakie dane gromadzimy, w jakim celu je
            przetwarzamy oraz jak dbamy o ich bezpieczeństwo.
          </p>

          <section>
            <h2>1. Kto jest administratorem Twoich danych?</h2>
            <p>
              Administratorem danych osobowych przetwarzanych przez Aplikację jest właściciel
              projektu Parkowanko. W razie pytań dotyczących prywatności prosimy o kontakt poprzez
              platformę Google Play lub kanały komunikacji dewelopera.
            </p>
          </section>

          <section>
            <h2>2. Jakie dane gromadzimy i dlaczego?</h2>

            <h3>A. Dane rejestracyjne</h3>
            <p>Podczas zakładania konta prosimy o podanie:</p>
            <ul>
              <li>
                <strong>Adresu e-mail</strong>: Służy do identyfikacji konta oraz ewentualnego
                odzyskiwania hasła.
              </li>
              <li>
                <strong>Nazwy użytkownika</strong>: Służy do personalizacji Twojego profilu w sekcji
                opinii.
              </li>
              <li>
                <strong>Hasła</strong>: Przechowywane w formie zaszyfrowanej, nieznanej
                administratorowi.
              </li>
            </ul>

            <h3>B. Lokalizacja (GPS)</h3>
            <p>
              Aplikacja Parkowanko opiera się na usługach lokalizacyjnych. Za Twoją zgodą Aplikacja
              uzyskuje dostęp do <strong>dokładnej lokalizacji GPS</strong> w celu:
            </p>
            <ul>
              <li>Wyświetlenia Twojej pozycji na mapie.</li>
              <li>Wyszukania najbliższych dostępnych parkingów.</li>
              <li>Nawigacji do wybranego punktu.</li>
            </ul>
            <p>
              Twoje dane o lokalizacji są przetwarzane w czasie rzeczywistym i nie są trwale
              zapisywane w bazie danych bez Twojej wyraźnej akcji.
            </p>
          </section>

          <section>
            <h2>3. Usługi podmiotów trzecich</h2>
            <p>W celu zapewnienia najwyższej jakości, korzystamy z usług zaufanych partnerów:</p>
            <ul>
              <li><strong>MapLibre GL / OpenStreetMap</strong>: Służą do wyświetlania map.</li>
              <li>
                <strong>Sentry</strong>: Narzędzie do monitorowania błędów. Pomaga nam naprawiać
                awarie Aplikacji.
              </li>
              <li><strong>Render</strong>: Nasz dostawca serwerów API i bazy danych.</li>
              <li><strong>Cloudflare Pages</strong>: Hosting Aplikacji.</li>
            </ul>
          </section>

          <section>
            <h2>4. Pamięć Lokalna</h2>
            <p>Aplikacja korzysta z technologii <strong>LocalStorage</strong> do:</p>
            <ul>
              <li>
                Przechowywania sesji użytkownika (tokeny JWT), abyś nie musiał logować się przy
                każdym uruchomieniu.
              </li>
              <li>Cache'owania map i danych dla trybu offline.</li>
            </ul>
          </section>

          <section>
            <h2>5. Twoje prawa</h2>
            <p>Zgodnie z RODO, masz prawo do:</p>
            <ul>
              <li>Dostępu do swoich danych oraz otrzymania ich kopii.</li>
              <li>Sprostowania lub usunięcia danych.</li>
              <li>
                Cofnięcia zgody na udostępnianie lokalizacji w ustawieniach systemu Android/iOS.
              </li>
            </ul>
          </section>
        </main>

        <a routerLink="/" class="back-link">← Wróć do aplikacji</a>
      </div>
    </div>
  `,
  styles: [
    `
      .privacy-wrapper {
        background-color: #f5f5f5;
        min-height: 100%;
        padding: 20px;
      }
      .privacy-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        color: #242424;
        line-height: 1.6;
      }
      .privacy-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
        border-bottom: 2px solid var(--par-color-primary, #1098f7);
        padding-bottom: 10px;
      }
      .privacy-header h1 {
        margin: 0;
        color: var(--par-color-primary, #1098f7);
        font-size: 1.8rem;
      }
      h2 {
        margin-top: 30px;
        color: var(--par-color-primary, #1098f7);
        font-size: 1.4rem;
      }
      h3 {
        margin-top: 20px;
        font-size: 1.1rem;
      }
      .update-date {
        font-style: italic;
        color: #666;
        margin-bottom: 30px;
        font-size: 0.9rem;
      }
      .privacy-content p,
      .privacy-content li {
        font-weight: 300;
        margin-bottom: 15px;
      }
      .privacy-content ul {
        padding-left: 20px;
      }
      .back-link {
        display: inline-block;
        margin-top: 40px;
        text-decoration: none;
        color: var(--par-color-primary, #1098f7);
        font-weight: 500;
      }
      .back-link:hover {
        text-decoration: underline;
      }
      @media (max-width: 600px) {
        .privacy-container {
          padding: 20px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyComponent {}
