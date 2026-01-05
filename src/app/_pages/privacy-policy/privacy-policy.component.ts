import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="privacy-container">
      <header class="privacy-header">
        <button mat-icon-button routerLink="/">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Polityka Prywatności</h1>
      </header>

      <main class="privacy-content">
        <section>
          <h2>1. Informacje ogólne</h2>
          <p>
            Aplikacja "Parkowanko" dba o prywatność swoich użytkowników. Niniejsza polityka
            wyjaśnia, jakie dane przetwarzamy i w jakim celu.
          </p>
        </section>

        <section>
          <h2>2. Dane lokalizacyjne</h2>
          <p>
            Podstawową funkcją aplikacji jest pomoc w znalezieniu parkingów. W tym celu aplikacja
            prosi o dostęp do lokalizacji GPS Twojego urządzenia. Dane te są używane wyłącznie do:
          </p>
          <ul>
            <li>Wyświetlenia Twojej pozycji na mapie.</li>
            <li>Obliczenia odległości do najbliższych parkingów.</li>
          </ul>
          <p>
            Twoja dokładna lokalizacja nie jest przechowywana na naszych serwerach w sposób trwały.
          </p>
        </section>

        <section>
          <h2>3. Konta użytkowników</h2>
          <p>
            Jeśli zdecydujesz się założyć konto, będziemy przetwarzać Twój adres e-mail oraz nazwę
            użytkownika w celu umożliwienia logowania oraz personalizacji aplikacji (np.
            zapamiętywanie dodanych parkingów).
          </p>
        </section>

        <section>
          <h2>4. Usługi zewnętrzne</h2>
          <p>
            Aplikacja korzysta z zewnętrznych dostawców usług w celu zapewnienia najlepszej jakości:
          </p>
          <ul>
            <li><strong>MapLibre GL / OpenStreetMap:</strong> Do renderowania mapy.</li>
            <li>
              <strong>GUGiK:</strong> Do geokodowania adresów (zamiana współrzędnych na adresy).
            </li>
            <li><strong>Sentry:</strong> Do monitorowania błędów technicznych aplikacji.</li>
          </ul>
        </section>

        <section>
          <h2>5. Bezpieczeństwo</h2>
          <p>
            Stosujemy nowoczesne środki techniczne, aby chronić Twoje dane przed nieautoryzowanym
            dostępem.
          </p>
        </section>

        <section>
          <h2>6. Kontakt</h2>
          <p>
            W razie pytań dotyczących prywatności, prosimy o kontakt poprzez repozytorium projektu
            lub bezpośrednio.
          </p>
        </section>

        <p class="last-update">Ostatnia aktualizacja: 5 stycznia 2026 r.</p>
      </main>
    </div>
  `,
  styles: [
    `
      .privacy-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.6;
        color: #333;
        font-family: 'Roboto', sans-serif;
      }
      .privacy-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 32px;
        border-bottom: 1px solid #eee;
        padding-bottom: 16px;
      }
      .privacy-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 500;
      }
      .privacy-content h2 {
        margin-top: 24px;
        font-size: 18px;
        font-weight: 500;
        color: #1976d2;
      }
      .privacy-content ul {
        padding-left: 20px;
      }
      .last-update {
        margin-top: 48px;
        font-size: 14px;
        color: #777;
        font-style: italic;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyComponent {}
