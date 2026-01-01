import { Subject } from 'rxjs';

export interface SheetRef<T> {
  dismiss: () => void;
  onDismiss: Subject<T>;
}
