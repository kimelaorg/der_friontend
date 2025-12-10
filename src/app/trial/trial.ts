import { Component, OnInit, TemplateRef, inject, signal, WritableSignal, ViewChild } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { faTrash, faTimesCircle, faCheckCircle, faSpinner, faHdd, faDownload } from '@fortawesome/free-solid-svg-icons';
import { catchError, finalize } from 'rxjs/operators';
import { throwError, forkJoin, Observable } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

interface FieldErrors { [key: string]: string[]; }

interface StagedFile {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'complete' | 'error';
    uploadProgress: number;
    name: string;
    category: string;
    size_mb: number;
    errorMessage?: string;
}

interface SoftwareRecord {
    id: number;
    name: string;
    mime_type: string;
    size_mb: number;
    category: string;
    file: string;
}


@Component({
    selector: 'app-trial',
    standalone: false,
    templateUrl: './trial.html',
    styleUrl: './trial.scss',
})
export class Trial implements OnInit {

  isActive = false;

  constructor() { }

  ngOnInit(): void {
    // Initialization logic here if needed
  }

  toggleMenu() {
    this.isActive = !this.isActive;
  }
}
