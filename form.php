<?php if (!current_user_can('edit_pages')) die('Please do not call this page directly.'); ?>

<form data-txform='<?php echo $formId ?>' class='tixys-search' method='get' action=''<?php if ($target === 'new') echo " target='_blank'" ?>>
    <script type="text/javascript">/* <![CDATA[ */
        <?php
            $txForm = [
                'from' => $from ?: null,
                'to' => $to ?: null,
                'datepicker' => (bool)$datepicker
            ];

            printf("var txForms = txForms || {};\n");
            printf("txForms[%d] = %s;\n", $formId, json_encode($txForm));
        ?>
    /* ]]> */</script>

    <table>
        <?php if (!$from) : ?>
        <tr>
            <th><label for='tixys-select-station-from-<?php echo $formId ?>'><?php _e('From:', 'tixys') ?></label></th>
            <td>
                <select class='tixys-select-station-from' id='tixys-select-station-from-<?php echo $formId ?>' name='from'>
                    <option value='0' selected='selected'><?php _e("– Please select –", 'tixys') ?></option>
                    <?php
                        $stationList = $to
                            ? $backend->get_result('to', $to)
                            : $backend->get_result('start');

                        foreach ($stationList as $id => $name)
                            printf("<option value='%d'>%s</option>\n", $id, $name);
                    ?>
                </select>
            </td>
            <td class='tixys-indicator'><img class='tixys-from' src='<?php echo $urlbase ?>/spinner.gif'></td>
        </tr>
        <?php endif ?>

        <?php if (!$to) : ?>
        <tr>
            <th><label for='tixys-select-station-to-<?php echo $formId ?>'><?php _e('To:', 'tixys') ?></label></th>
            <td>
                <select class='tixys-select-station-to' id='tixys-select-station-to-<?php echo $formId ?>' name='to'<?php if (!$from) echo " disabled='disabled'" ?>>
                <?php if ($from) : ?>
                    <option value='0' selected='selected'><?php _e("– Please select –", 'tixys') ?></option>
                    <?php
                        $stationList = $backend->get_result('from', $from);

                        foreach ($stationList as $id => $name)
                            printf("<option value='%d'>%s</option>\n", $id, $name);
                    ?>
                <?php endif ?>
                </select>
            </td>
            <td class='tixys-indicator'><img class='tixys-to' src='<?php echo $urlbase ?>/spinner.gif'></td>
        </tr>
        <?php endif ?>

        <?php if ($datepicker) : ?>
            <tr>
                <th><label for='tixys-select-day-<?php echo $formId ?>'><?php _e('Day:', 'tixys') ?></label></th>
                <td colspan='2'>
                    <input type='text' class='tixys-select-day' id='tixys-select-day-<?php echo $formId ?>' />
                    <input type='hidden' name='day' value='' />
                </td>
            </tr>
        <?php endif ?>

        <tr>
            <th></th>
            <td colspan='2'>
                <?php if ($affiliate) : ?>
                <input type='hidden' name='aff' value='<?php echo $affiliate ?>' />
                <?php endif ?>

                <?php if ($from) : ?>
                <input type='hidden' name='from' value='<?php echo $from ?>' />
                <?php endif ?>
                <?php if ($to) : ?>
                <input type='hidden' name='to' value='<?php echo $to ?>' />
                <?php endif ?>

                <input type='submit' value='<?php _e('Search connections and buy a ticket »', 'tixys') ?>' />
            </td>
        </tr>
        <tr>
            <th></th>
            <td colspan='2' class='tixys-home'><?php _e("Powered by the <a href='http://www.tixys.com/' target='_blank'>Tixys booking platform</a>.", 'tixys') ?></td>
        </tr>
    </table>
</form>
