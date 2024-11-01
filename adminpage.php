<?php
    if (!current_user_can('edit_pages')) die('Please do not call this page directly.');

    $tixys_options = get_option('tixys_options');
?>

<div class="wrap">
    <h2><?php _e('Tixys configuration', 'tixys') ?></h2>

    <form action="<?php echo htmlentities($_SERVER['REQUEST_URI']) ?>" method="post">
        <table class="form-table">
            <tr>
                <th scope="row"><label for="tixys_site"><?php _e('Shop ID', 'tixys') ?></label></th>
                <td>
                    <input name="tixys_site" type="number" id="tixys_site" class='small-text' value="<?php echo (int)$tixys_options->site ?: '' ?>" class="small-text" />
                    <p class="description"><?php _e("Your shop’s ID. You will find at the top of the “general settings” administration page of your shop.", 'tixys') ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="tixys_domain"><?php _e('Version', 'tixys') ?></label></th>
                <td>
                    <select name="tixys_domain" id="tixys_domain" class='regular-text'>
                        <?php
                            $domains = [
                                'free.tixys.com' => "Tixys Free",
                                'shop.tixys.com' => "Tixys Premium"
                            ];

                            foreach ($domains as $domain => $name)
                                printf(
                                    "<option value='%s'%s>%s</option>",
                                    $domain,
                                    $tixys_options->domain === $domain ? " selected='selected'" : '',
                                    "$name ($domain)"
                                );
                        ?>

                    </select>
                    <p class="description"><?php _e("Your Tixys version.", 'tixys') ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="tixys_path"><?php _e('Base path', 'tixys') ?></label></th>
                <td>
                    <input name="tixys_path" type="text" id="tixys_path" class='regular-text' value="<?php echo esc_html($tixys_options->path) ?: '' ?>" />
                    <p class="description"><?php _e("Your shop’s URL base path.", 'tixys') ?></p>
                </td>
            </tr>
        </table>

        <p class="submit">
            <input name="tixys_update" type="hidden" value="true" />
            <?php wp_nonce_field('tixys_update_options'); ?>
            <input type="submit" name="submit" id="submit" class="button button-primary" value="<?php _e('Submit Changes') ?>"  />
        </p>
    </form>
</div>
