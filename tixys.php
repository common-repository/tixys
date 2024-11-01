<?php
/**
 * Plugin Name: Tixys Widget
 * Plugin URI: http://www.tixys.com/
 * Description: This plugin embeds a Tixys search widget into a WP page.
 * Version: 0.2
 * Author: Alex Günsche
 * License: MIT
 */

class TixysWidget
{
    static private $instance;

    // because throwing the message and displaying it are separate tasks, we need to store the message
    private $lastMessage;

    static public function init()
    {
        self::$instance = new self();

        add_action('admin_init', [self::$instance, 'process_settings']);
        add_action('admin_menu', [self::$instance, 'adminpage']);
        add_action('init', [self::$instance, 'load_textdomain']);
        add_shortcode('tixysform', [self::$instance, 'generate_form']);
        register_activation_hook(__FILE__, [self::$instance, 'activate']);
    }

    public function activate()
    {
        $oldOptions = get_option('tixys_options');



        $options = (object)[
            'site' => null,
            'domain' => null,
            'path' => null
        ];

        add_option('tixys_options', $options);
    }

    public function load_textdomain()
    {
        load_plugin_textdomain('tixys', false, 'tixys');
    }

    public function adminpage()
    {
        add_options_page(__('Tixys configuration', 'tixys'), 'Tixys', 'edit_pages', dirname(__FILE__).'/adminpage.php');
    }

    public function process_settings()
    {
        if (isset($_POST['tixys_update']) && $_POST['tixys_update'] === 'true')
        {
            check_admin_referer('tixys_update_options');
            $error = '';

            if (!isset($_POST['tixys_site']) || !is_numeric($_POST['tixys_site']) || (int)$_POST['tixys_site'] < 2)
                $error = __('ERROR: The shop ID must be a positive number.', 'tixys');

            elseif (!isset($_POST['tixys_domain']) || !preg_match('|^[a-z][a-z0-9\.]{4,}$|', $_POST['tixys_domain']))
                $error = __('ERROR: The shop domain may only contain lowercase latin letters, numbers and dots.', 'tixys');

            elseif (!isset($_POST['tixys_path']) || !preg_match('|^[a-z][a-z0-9\-]{4,}$|', $_POST['tixys_path']))
                $error = __('ERROR: The shop path may only contain lowercase latin letters, numbers and dashes.', 'tixys');

            if ($error)
            {
                $this->lastMessage = [$error, true];
            }
            else
            {
                $options = get_option('tixys_options') ?: new \stdClass();
                $options->site = (int)$_POST['tixys_site'];
                $options->domain = $_POST['tixys_domain'];
                $options->path = $_POST['tixys_path'];

                update_option('tixys_options', $options);
                $this->lastMessage = [__('The settings have been updated.', 'tixys'), false];
            }

            add_action('admin_notices', [$this, 'admin_notice']);
        }
    }

    public function admin_notice()
    {
        if (is_array($this->lastMessage))
        {
            ?>
                <div class="updated <?php echo $this->lastMessage[1] ? ' error' : '' ?>">
                    <p><?php echo $this->lastMessage[0] ?></p>
                </div>
            <?php
        }
    }

    public function generate_form($attr, $content = null, $code = "")
    {
        global $formId, $wp_scripts;

        $options = get_option('tixys_options');

        if ($options->site && $options->path)
        {
            $urlbase = plugin_dir_url(__FILE__);
            $formId = isset($formId) ? ++$formId : 1;

            extract(shortcode_atts(array(
                // defaults
                'target' => 'new',
                'datepicker' => false,
                'affiliate' => null,
                'from' => null,
                'to' => null,
            ), $attr), EXTR_SKIP);

            $datepicker = ($datepicker === 'true');
            $affiliate = (is_numeric($affiliate) && $affiliate > 0) ? (int)$affiliate : null;
            $from = (is_numeric($from) && $from > 0) ? (int)$from : null;
            $to = (is_numeric($to) && $to > 0) ? (int)$to : null;

            require_once dirname(__FILE__).'/backend.php';
            $backend = new TixysBackend($options);

            wp_enqueue_script('tixys-lib', "$urlbase/tx.lib.js");
            wp_enqueue_script('tixys-form', "$urlbase/tx.page.js");
            wp_enqueue_style('tixys-form', "$urlbase/tx.form.css");

            if ($datepicker)
            {
                wp_enqueue_script('jquery-ui-datepicker');
                $ui = $wp_scripts->query('jquery-ui-core');
                $cssurl = (is_ssl() ? 'https' : 'http') . "://ajax.aspnetcdn.com/ajax/jquery.ui/{$ui->ver}/themes/smoothness/jquery-ui.css";
                wp_enqueue_style('tixys-jquery-ui-smoothness', $cssurl, false, $ui->ver);
            }

            ob_start();

            if ($formId === 1)
            {
                $domain = $options->domain ?: 'shop.tixys.com';
                $locale = get_locale();

                print("
                    <script type='text/javascript'>/* <![CDATA[ */
                        var Tx = { config : {
                            site        : {$options->site},
                            locale      : '$locale',
                            urlBase     : 'https://$domain/{$options->path}',
                            apiBase     : 'https://$domain/api'
                        }};
                    /* ]]> */</script>");
            }

            require dirname(__FILE__).'/form.php';
            return ob_get_clean();
        }
    }
}

TixysWidget::init();
