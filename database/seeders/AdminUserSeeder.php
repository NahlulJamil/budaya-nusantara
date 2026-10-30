<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::firstOrNew(['email' => 'admin@email.com']);

        $admin->forceFill([
            'username' => 'admin',
            'email' => 'admin@email.com',
            'password' => Hash::make('Admin123'),
            'role' => 'admin',
        ])->save();
    }
}
