import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StoreinPage } from '../storein/storein.page';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {

  component = StoreinPage;

  constructor(private router:Router) { }

  ngOnInit() {
  }

  

}
