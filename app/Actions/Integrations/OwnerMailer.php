<?php

namespace App\Actions\Integrations;

use App\Models\Storefront;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Sends a renter email through the owner's own Resend account (over SMTP, no
 * extra package), from their own address. Owners who haven't connected Resend
 * use the platform's default mailer.
 */
class OwnerMailer
{
    /**
     * Point the message at the owner's mailer when they have connected one.
     */
    public function apply(MailMessage $message, ?Storefront $storefront): MailMessage
    {
        $mailer = $this->mailerFor($storefront);

        if ($mailer === null) {
            return $message;
        }

        return $message->mailer($mailer)->from((string) $storefront->mail_from_address, $storefront->name);
    }

    /**
     * Register a per-owner SMTP mailer for Resend and return its name, or null
     * when the owner hasn't set up email.
     */
    public function mailerFor(?Storefront $storefront, bool $ignorePlan = false): ?string
    {
        if (! $storefront || blank($storefront->resend_api_key) || blank($storefront->mail_from_address) || (! $ignorePlan && ! $storefront->owner->planIncludes('branded_email'))) {
            return null;
        }

        $name = "owner_{$storefront->id}";

        config(["mail.mailers.{$name}" => [
            'transport' => 'smtp',
            'host' => 'smtp.resend.com',
            'port' => 587,
            'username' => 'resend',
            'password' => $storefront->resend_api_key,
            'encryption' => 'tls',
            'timeout' => 15,
        ]]);

        app('mail.manager')->purge($name);

        return $name;
    }
}
