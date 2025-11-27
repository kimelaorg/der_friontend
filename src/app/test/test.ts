import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';


interface InventoryItem {
  id: number;
  // Change types to string for easier autocomplete matching
  product: string;
  quantity_in_stock: number;
  safety_stock_level: number;
  // Change types to string for easier autocomplete matching
  location: string;
}

// --- Mock Data Structures (In a real app, these would come from a service) ---

// Products list for autocomplete suggestions
const allProducts: string[] = [
  'Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Webcam',
  'Printer', 'Server', 'Router', 'Switch', 'Firewall'
];

// Locations list for autocomplete suggestions
const allLocations: string[] = [
  'Warehouse A', 'Stockroom B', 'Display Floor', 'Office Storage', 'Repair Bench'
];
// ---------------------------------------------------------------------------


@Component({
  selector: 'app-test',
  standalone: false,
  templateUrl: './test.html',
  styleUrl: './test.scss',
})


export class Test implements OnInit {

  @ViewChild('content') content!: ElementRef;

  // Update InventoryItem mock data to use strings for product and location
  inventory: InventoryItem[] = [
    { id: 1, product: 'Laptop', quantity_in_stock: 500, safety_stock_level: 100, location: 'Warehouse A' },
    { id: 2, product: 'Monitor', quantity_in_stock: 1250, safety_stock_level: 200, location: 'Stockroom B' },
    { id: 3, product: 'Keyboard', quantity_in_stock: 80, safety_stock_level: 50, location: 'Warehouse A' }
  ];

  currentItem: InventoryItem = this.getNewEmptyItem();

  isEditing = false;
  nextId = 4;

  // 2. Inject NgbModal
  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {
  }

  getNewEmptyItem(): InventoryItem {
    return {
      id: 0,
      product: '', // Changed to string
      quantity_in_stock: 0,
      safety_stock_level: 0,
      location: '' // Changed to string
    };
  }


  public formatter = (value: string): string => value;
  public inputFormatter = (value: string): string => value;


  searchProduct = (text$: Observable<string>) =>
    text$.pipe(

      debounceTime(200),

      distinctUntilChanged(),

      map(term => term.length < 2 ? [] : allProducts.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    );


  searchLocation = (text$: Observable<string>) =>
    text$.pipe(

      debounceTime(200),

      distinctUntilChanged(),

      map(term => term.length < 2 ? [] : allLocations.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    );


  openAddModal() {
    this.isEditing = false;
    this.currentItem = this.getNewEmptyItem();
    this.modalService.open(this.content, { ariaLabelledBy: 'modal-basic-title' });
  }


  openEditModal(item: InventoryItem) {
    this.isEditing = true;
    this.currentItem = { ...item };
    this.modalService.open(this.content, { ariaLabelledBy: 'modal-basic-title' });
  }


  onSubmit(form: NgForm) {
    if (form.invalid) {
      return;
    }

    if (this.isEditing) {

      const index = this.inventory.findIndex(item => item.id === this.currentItem.id);
      if (index !== -1) {
        this.inventory[index] = { ...this.currentItem };
      }
    } else {

      const newItem: InventoryItem = { ...this.currentItem, id: this.nextId++ };
      this.inventory.push(newItem);
    }


    this.modalService.dismissAll();


    this.currentItem = this.getNewEmptyItem();
    form.resetForm(this.currentItem);
  }


  deleteItem(id: number) {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      this.inventory = this.inventory.filter(item => item.id !== id);
    }
  }
}
