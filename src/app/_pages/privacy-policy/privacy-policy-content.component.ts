import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-privacy-policy-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="italic text-[#666] mb-[30px] font-small">
      Ostatnia aktualizacja: 26 stycznia 2026 r.
    </p>

    <div class="font-light leading-relaxed [&_p]:mb-[15px] [&_li]:mb-[15px]">
      <p>
        Aplikacja <strong>Parkowanko</strong> (dalej: "Aplikacja") dba o prywatność swoich
        użytkowników. Niniejszy dokument opisuje, jakie dane gromadzimy, w jakim celu je
        przetwarzamy oraz jak dbamy o ich bezpieczeństwo.
      </p>

      <section>
        <h2 class="mt-[30px] text-[--par-color-primary] font-large font-bold">
          1. Kto jest administratorem Twoich danych?
        </h2>
        <p>
          Administratorem danych osobowych przetwarzanych przez Aplikację jest właściciel projektu
          Parkowanko. W razie pytań dotyczących prywatności prosimy o kontakt poprzez platformę
          Google Play lub kanały komunikacji dewelopera.
        </p>
      </section>

      <section>
        <h2 class="mt-[30px] text-[--par-color-primary] font-large font-bold">
          2. Jakie dane gromadzimy i dlaczego?
        </h2>

        <h3 class="mt-5 font-big font-bold">A. Dane rejestracyjne</h3>
        <p>Podczas zakładania konta prosimy o podanie:</p>
        <ul class="list-disc pl-5">
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

        <h3 class="mt-5 font-big font-bold">B. Lokalizacja (GPS)</h3>
        <p>
          Aplikacja Parkowanko opiera się na usługach lokalizacyjnych. Za Twoją zgodą Aplikacja
          uzyskuje dostęp do <strong>dokładnej lokalizacji GPS</strong> w celu:
        </p>
        <ul class="list-disc pl-5">
          <li>Wyświetlenia Twojej pozycji na mapie.</li>
          <li>Wyszukania najbliższych dostępnych parkingów.</li>
          <li>Nawigacji do wybranego punktu.</li>
        </ul>
        <p>
          Twoje dane o lokalizacji są przetwarzane w czasie rzeczywistym i nie są trwale zapisywane
          w bazie danych bez Twojej wyraźnej akcji.
        </p>
      </section>

      <section>
        <h2 class="mt-[30px] text-[--par-color-primary] font-large font-bold">
          3. Usługi podmiotów trzecich
        </h2>
        <p>W celu zapewnienia najwyższej jakości, korzystamy z usług zaufanych partnerów:</p>
        <ul class="list-disc pl-5">
          <li><strong>MapLibre GL / OpenStreetMap</strong>: Służą do wyświetlania map.</li>
          <li>
            <strong>Sentry</strong>: Narzędzie do monitorowania błędów. Pomaga nam naprawiać awarie
            Aplikacji.
          </li>
          <li><strong>Render</strong>: Nasz dostawca serwerów API i bazy danych.</li>
          <li><strong>Cloudflare Pages</strong>: Hosting Aplikacji.</li>
        </ul>
      </section>

      <section>
        <h2 class="mt-[30px] text-[--par-color-primary] font-large font-bold">4. Pamięć Lokalna</h2>
        <p>Aplikacja korzysta z technologii <strong>LocalStorage</strong> do:</p>
        <ul class="list-disc pl-5">
          <li>
            Przechowywania sesji użytkownika (tokeny JWT), abyś nie musiał logować się przy każdym
            uruchomieniu.
          </li>
          <li>Cache'owania map i danych dla trybu offline.</li>
        </ul>
      </section>

      <section>
        <h2 class="mt-[30px] text-[--par-color-primary] font-large font-bold">5. Twoje prawa</h2>
        <p>Zgodnie z RODO, masz prawo do:</p>
        <ul class="list-disc pl-5">
          <li>Dostępu do swoich danych oraz otrzymania ich kopii.</li>
          <li>Sprostowania lub usunięcia danych.</li>
          <li>Cofnięcia zgody na udostępnianie lokalizacji w ustawieniach systemu Android/iOS.</li>
        </ul>
      </section>
    </div>
  `,
  host: {
    class: 'flex flex-col gap-4 py-[20px]',
  },
})
export class PrivacyPolicyContentComponent {}
