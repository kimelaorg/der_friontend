import { Component, signal, WritableSignal, inject, OnInit } from '@angular/core';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import { faStar, faPlus, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { ActionButton } from '../../../Layout/Components/page-title/page-title.component';
import { HttpClient } from "@angular/common/http";
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl, NonNullableFormBuilder } from '@angular/forms';


export interface ProductCategory {
  id?: number;
  name: string;
  description: string;
  created_at: string;
  status: boolean;
  is_digital: boolean;
}

interface CategoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductCategory[];
}


interface CartegoryForm {
  name: FormControl<string>;
  description: FormControl<string>;
  is_digital: FormControl<string>;
  status: FormControl<string>;
}


@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {

  closeResult = '';

  http = inject(HttpClient);
  private router = inject(Router);
  private formBuilder = inject(NonNullableFormBuilder);
  constructor(private modalService: NgbModal) {}

  private baseUrl = 'http://localhost:8000/api/setups';
  categoryUrl = `${this.baseUrl}/categories/`;
  categories: ProductCategory[] = [];
  message: WritableSignal<string | null> = signal(null);
  isLoading: WritableSignal<boolean> = signal(false);
  currentCategoryData: WritableSignal<ProductCategory | null> = signal(null);

  newCartegoryForm: FormGroup<CartegoryForm> = this.formBuilder.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    is_digital: ['', [Validators.required]],
    status: ['true', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadAll()
  }

  loadAll(): void {
    this.http.get<ProductCategory[]>(`${this.categoryUrl}`).subscribe(res => {
      this.categories = res;
    });
  }


  handleCreateModal = () => {
    this.newCartegoryForm.reset();
    this.newCartegoryForm.patchValue({ status: 'true' });
    this.currentCategoryData.set(null);
  }

  open(content: any | null){
    this.modalService.open(content).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;

      if (result === 'saved' || result === 'deleted') {
        this.loadAll();
      }
      console.log(this.closeResult);
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      console.log(this.closeResult);
    });
  }


  openCentred(content: any) {
    this.modalService.open(content, {centered: true});
  }

  openAddCategoryModel(content: any) {
    this.modalService.open(content, {
      size: 'md'
    });
  }

  openLarge(content: any) {
    this.modalService.open(content, {
      size: 'lg'
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

}
