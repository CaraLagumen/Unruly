import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { AuthGuard } from "./auth/guards/auth.guard";
import { AuthSchedulerGuard } from "./auth/guards/auth-scheduler.guard";

const routes: Routes = [
  {
    path: "auth",
    loadChildren: "./auth/auth.module#AuthModule",
  },
  { path: "", redirectTo: "/calendar", pathMatch: "full" },
  {
    path: "calendar",
    loadChildren: "./calendar/calendar.module#CalendarModule",
  },
  {
    path: "editor",
    canActivate: [AuthSchedulerGuard],
    loadChildren: "./editor/editor.module#EditorModule",
  },
  {
    path: "stats",
    canActivate: [AuthGuard],
    loadChildren: "./stats/stats.module#StatsModule",
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard, AuthSchedulerGuard],
})
export class AppRoutingModule {}
