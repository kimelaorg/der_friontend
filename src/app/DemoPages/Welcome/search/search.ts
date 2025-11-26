import {
  Component,
  signal,
  viewChild,
  ElementRef,
  AfterViewInit,
  inject,
  ChangeDetectionStrategy,
  Injectable,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, startWith, switchMap, tap, finalize, catchError } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { of, Observable } from 'rxjs';
import { SearchSpecific } from '../search-specific/search-specific';

// --- INTERFACES FOR API DATA STRUCTURE ---

/**
 * Defines the structure for a product result item.
 * We only need 'id' and 'name' for the search dropdown.
 */
interface Product {
  id: number;
  name: string;
  // Other fields from the API are ignored for brevity in this component:
  // description: string;
  // category: number;
  // etc.
}

/**
 * Defines the structure of the full API response with pagination.
 */
interface ProductApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

// --- SEARCH SERVICE (API LAYER) ---

@Injectable({ providedIn: 'root' })
class SearchService {
  // Use the actual endpoint provided by the user
  private API_BASE_URL = "http://127.0.0.1:8000/api/products/public-catalog/";

  /**
   * Fetches products from the API endpoint based on the search query.
   * This uses new Observable with fetch() for explicit async control and error handling.
   * @param query The search term to send to the API.
   * @returns An Observable of Product arrays.
   */
  fetchProducts(query: string): Observable<Product[]> {
    // Ensure the API URL is correctly constructed
    const searchUrl = `${this.API_BASE_URL}?search=${encodeURIComponent(query)}`;

    // Using new Observable to explicitly manage the async lifecycle of fetch
    return new Observable<Product[]>((subscriber) => {
      let isCanceled = false; // Flag to handle potential cancellation by switchMap

      const fetchData = async () => {
        try {
          const response = await fetch(searchUrl);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP Status Error: ${response.status} for query "${query}". Response: ${errorText}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const apiResponse: ProductApiResponse = await response.json();

          if (isCanceled) return; // Do not emit if the request was canceled (new input started)

          // CRUCIAL DEBUGGING STEP: Log the array being passed to the component
          console.log('API Response Results (for debugging):', apiResponse.results);

          subscriber.next(apiResponse.results);
          subscriber.complete();

        } catch (error) {
          if (!isCanceled) {
            console.error('API Search Error during fetch or parsing:', query, error);
            subscriber.error(error);
          }
        }
      };

      fetchData();

      // Teardown logic for RxJS switchMap to handle cancellation
      return () => {
        isCanceled = true;
      };
    }).pipe(
      // Catch the observable error and return an empty array to prevent component failure
      catchError((error) => {
        return of([]);
      })
    );
  }
}

// --- ANGULAR COMPONENT ---

@Component({
  selector: 'app-search',
  standalone: false,
  // imports: [ReactiveFormsModule, RouterLink],
  template: `
    <!-- Main wrapper -->
    <div class="relative flex justify-center items-center h-full pt-10">
      <div class="searchBox">
        <form (submit)="submit($event)">
          <input
            [style]="{
              width: '22rem',
              overflow: 'hidden',
              background: 'white',
              color: 'black'
            }"
            type="text"
            [formControl]="searchControl"
            (focus)="showInput()"
            (blur)="hideInput()"
            #searchInput
            placeholder="Search desired product"
            autocomplete="off"
          />
        </form>
        <!-- Custom SVG Search Icon -->
        <svg
          class="searchIcon"
          (click)="submit($event)"
          (mousedown)="onMouseDown($event)"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <!-- Search Results Dropdown -->
        <div
          class="searchResults"
          *ngIf="isVisible()"
          (mousedown)="onMouseDown($event)"
        >
          <div class="searchResult">

            <!-- DEBUG AREA: Temporarily added to confirm data is present in the signal -->
            @if (foundItems().length > 0 && !isLoading()) {
                <p class="text-sm text-green-600 px-4 py-1 border-b border-gray-100">
                    DEBUG: Found {{ foundItems().length }} item(s).
                </p>
            }
            <!-- END DEBUG AREA -->

            @if (isLoading()) {
              <div class="loading-indicator">
                <!-- Simple Loading Spinner SVG (using Tailwind styles for spin) -->
                <svg class="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Searching...</span>
              </div>
            } @else {
              <!-- Use @if to check if results are available before running @for -->
              @if (foundItems().length > 0) {
                  @for (item of foundItems(); track item.id) {
                    <!--
                        FIX: Integrated the ProductLink functionality directly here.
                        1. Use [routerLink] for navigation.
                        2. Use (click) to call hideInput(true) for immediate close.
                        3. Use the .search-item-link class defined in styles below.
                    -->
                    <a
                      [routerLink]="['/der/product', item.id]"
                      (click)="hideInput(true)"
                      class="search-item-link"
                    >
                      <!-- Content -->
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="inline mr-2 text-gray-500"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <span> {{ item.name }} </span>
                    </a>
                  }
              } @else {
                <p class="placeHolderTxt">
                  @if (searchControl.value.length === 0) {
                    Start typing to see product suggestions.
                  } @else {
                    No products found for "{{ searchControl.value }}".
                  }
                </p>
              }
            }
          </div>
        </div>
      </div>
      <!-- Overlay to close on click outside -->
      <div
        class="overlay"
        *ngIf="isVisible()"
        (click)="isVisible.set(false)"
      ></div>
    </div>
  `,
  styles: [
    `
      /*
       * Using Inter font and Tailwind defaults for aesthetics
       */
      :host {
        display: block;
        font-family: 'Inter', sans-serif;
      }

      .searchBox {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        /* Padding adapted for responsiveness */
        padding-left: 300px;
        width: 100%; /* Ensure it spans available width */
        max-width: 700px; /* Limit max width for desktop */
      }

      .searchBox input {
        width: 100%; /* Make input full width of its container */
        max-width: 400px;
        padding: 10px 40px 10px 20px;
        font-size: 16px;
        outline: none;
        border: 2px solid #ccc;
        border-radius: 8px; /* Added rounded corners for modern look */
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: border-color 0.3s, box-shadow 0.3s;
      }

      .searchBox input:focus {
        border-color: #0073e6;
        box-shadow: 0 2px 8px rgba(0, 115, 230, 0.3);
      }

      .searchBox input::placeholder {
        color: #999;
      }

      .searchBox .searchIcon {
        position: absolute;
        cursor: pointer;
        font-size: 20px;
        right: 20px;
        color: #666;
        transition: color 0.2s;
        z-index: 101; /* Ensure icon is above input */
      }

      .searchBox .searchIcon:hover {
        color: #0073e6;
      }

      .searchBox .searchResults {
        /* Width adjusted based on input width */
        width: min(650px, 90vw);
        height: 400px;
        background-color: #ffffff; /* Switched to white for contrast */
        position: absolute;
        display: flex;
        flex-direction: column;
        top: 85px;
        left: 50%;
        /* Centering logic adjusted due to initial padding-left: 300px */
        transform: translateX(calc(-50% + 150px));
        z-index: 350;
        overflow-y: auto;
        overflow-x: hidden;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); /* Slightly stronger shadow */
        border: 1px solid #eee;
      }

      .searchBox .searchResults::-webkit-scrollbar {
        width: 8px;
      }

      .searchBox .searchResults::-webkit-scrollbar-thumb {
        background-color: #ddd;
        border-radius: 4px;
      }

      .searchBox .searchResult {
        width: 100%;
        padding: 10px 0; /* Adjusted padding */
        gap: 5px;
        display: flex;
        flex-direction: column;
      }

      .searchBox .searchResult .placeHolderTxt {
        text-align: center;
        font-size: 16px;
        font-weight: 500;
        color: #a0a0a0;
        padding: 50px 20px;
      }

      .loading-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 50px 20px;
        color: #0073e6;
        font-weight: 600;
        font-size: 16px;
      }

      .searchBox .searchResult .search-item-link {
        color: #333;
        text-decoration: none;
        font-weight: 400;
        padding: 8px 20px;
        border-radius: 4px;
        transition: background-color 0.2s, color 0.2s;
        display: flex;
        align-items: center;
      }

      .searchBox .searchResult .search-item-link:hover {
        background-color: #f0f8ff;
        color: #0073e6;
      }

      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3); /* Slightly lighter overlay */
        z-index: 50;
      }

      /* --- RESPONSIVE STYLES --- */

      /* Tablet/Small Desktop */
      @media (max-width: 1024px) {
        .searchBox {
          padding-left: 150px;
        }
        .searchBox .searchResults {
            transform: translateX(calc(-50% + 75px)); /* Adjusted centering */
        }
      }

      /* Mobile/Tablet */
      @media (max-width: 768px) {
        /* For mobile, search results should typically be a separate page,
           but keeping the dropdown hidden by default when size is small */
        .searchBox .searchResults {
          display: none;
        }

        .searchBox {
          width: 90%;
          max-width: 400px;
          padding: 0; /* Remove desktop padding */
        }

        .searchBox input {
          max-width: 100%;
        }
      }

      /* Smaller Mobile */
      @media (max-width: 425px) {
        .searchBox {
          width: 95%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Search implements AfterViewInit {
  private searchService = inject(SearchService);

  // Signals for state management
  searchControl = new FormControl('', { nonNullable: true });
  isVisible = signal(false);
  isLoading = signal(false);

  // Signal to store the calculated fixed position of the results dropdown
  searchPosition = signal({
    top: '0px',
    left: '0px',
    width: '300px'
  });

  // ViewChild reference for the input element
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // Async search pipeline using RxJS to handle API calls
  private searchResults$ = this.searchControl.valueChanges.pipe(
    startWith(this.searchControl.value),
    debounceTime(300), // Wait 300ms after user stops typing
    tap(() => {
        const term = this.searchControl.value.trim();
        // Show loading state only if there's actual text being searched
        if (term.length > 0) {
            this.isLoading.set(true);
        }
    }),
    switchMap(term => {
        const query = term.trim();
        if (query.length === 0) {
            // If empty query, don't hit the API, just return an empty array instantly
            this.isLoading.set(false);
            return of([]);
        }
        // Call the service method to fetch data from the API
        return this.searchService.fetchProducts(query).pipe(
            finalize(() => this.isLoading.set(false)) // Hide loading spinner when API call completes (success or error)
        );
    })
  );

  // Final results signal derived from the async stream
  foundItems = toSignal(this.searchResults$, { initialValue: [] });

  // Flag to prevent 'blur' from closing the dropdown prematurely
  private mouseDownOnElement = false;

  ngAfterViewInit() {
    this.updateSearchPosition();
    // Re-calculate position on window resize to keep it aligned with the input
    window.addEventListener('resize', this.updateSearchPosition.bind(this));
  }

  // Method to calculate the position of the dropdown based on the input field's location
  updateSearchPosition() {
    const inputEl = this.searchInput()?.nativeElement;
    if (inputEl) {
      const rect = inputEl.getBoundingClientRect();
      const newWidth = Math.min(650, rect.width); // Keep width max 650px or input width
      this.searchPosition.set({
        // Position dropdown just below the input + a small margin
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        width: `${newWidth}px`
      });
    }
  }

  submit(event: Event) {
    event.preventDefault();
    // In a real application, this would navigate to the full search results page
    const term = this.searchControl.value;
    console.log(`Submitting full search for: ${term}`);
    this.hideInput(true); // Close immediately after submit
  }

  showInput() {
    // Before showing, update the position so it aligns correctly
    this.updateSearchPosition();
    this.isVisible.set(true);
  }

  /**
   * Hides the search results dropdown.
   * @param isNavigationClick If true, closes immediately (used by links or submit).
   * If false (default), applies timeout for blur/mousedown conflict resolution.
   */
  hideInput(isNavigationClick = false) {
    // FIX: If the call came from a navigation click or a successful submit, close immediately and skip the blur logic.
    if (isNavigationClick) {
        this.isVisible.set(false);
        // Ensure the input loses focus if it still has it
        // Note: Using blur() here may cause a flicker if a navigation is imminent,
        // but it cleans up the UI state.
        this.searchInput()?.nativeElement.blur();
        return;
    }

    // Existing blur handling logic (only runs if isNavigationClick is false):
    setTimeout(() => {
      if (!this.mouseDownOnElement) {
        this.isVisible.set(false);
      }
      // Reset the flag immediately after the blur check
      this.mouseDownOnElement = false;
    }, 150);
  }

  onMouseDown(event: MouseEvent) {
    // Prevent the 'blur' event from firing when clicking on the search icon or results panel
    this.mouseDownOnElement = true;
    event.preventDefault();

    // If clicking the search icon, focus on input to open results
    if (this.searchInput() && (event.target as HTMLElement).closest('.searchIcon')) {
        this.searchInput()?.nativeElement.focus();
    }
  }
}
