<?php

/* +***********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.0
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is:  vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 * *********************************************************************************** */

Class Users_EditAjax_View extends Vtiger_IndexAjax_View {

	function __construct() {
		parent::__construct();
		$this->exposeMethod('changePassword');
		$this->exposeMethod('changeUsername');
        $this->exposeMethod('addMultiFactorAuthenticationStep1');
        $this->exposeMethod('addMultiFactorAuthenticationStep2');
	}

	public function checkPermission(Vtiger_Request $request){
		$currentUserModel = Users_Record_Model::getCurrentUserModel();
		$userId = $request->get('recordId');
		if($currentUserModel->getId() != $userId && !$currentUserModel->isAdminUser()) {
			throw new AppException(vtranslate('LBL_PERMISSION_DENIED', 'Vtiger'));
		}
	}
	
	public function process(Vtiger_Request $request) {
		$mode = $request->get('mode');
		if (!empty($mode)) {
			$this->invokeExposedMethod($mode, $request);
			return;
		}
	}

	public function changePassword(Vtiger_Request $request) {
		$viewer = $this->getViewer($request);
		$moduleName = $request->get('module');
		$userId = $request->get('recordId');

		$viewer->assign('MODULE', $moduleName);
		$viewer->assign('USERID', $userId);
		$viewer->assign('CURRENT_USER_MODEL', Users_Record_Model::getCurrentUserModel());
		$viewer->view('ChangePassword.tpl', $moduleName);
	}

	public function changeUsername(Vtiger_Request $request) {
		$viewer = $this->getViewer($request);
		$moduleName = $request->getModule();
		$userId = $request->get('record');
		$userModel = Users_Record_Model::getInstanceFromPreferenceFile($userId);
		
		$viewer->assign('MODULE',$moduleName);
		$viewer->assign('USER_MODEL',$userModel);
		$viewer->assign('CURRENT_USER_MODEL', Users_Record_Model::getCurrentUserModel());
		$viewer->view('ChangeUsername.tpl', $moduleName);
	}

    public function addMultiFactorAuthenticationStep1(Vtiger_Request $request) {
        $viewer = $this->getViewer($request);
		$moduleName = $request->get('module');
		$userId = $request->get('recordId');

        $passkeyurl = "javascript:Users_Detail_Js.triggerAddMultiFactorAuthenticationNextStep('index.php?module=Users&view=EditAjax&mode=addMultiFactorAuthenticationStep2&type=passkey&recordId=$userId')";
        $totpurl = "javascript:Users_Detail_Js.triggerAddMultiFactorAuthenticationNextStep('index.php?module=Users&view=EditAjax&mode=addMultiFactorAuthenticationStep2&type=totp&recordId=$userId')";

        $viewer->assign('PASSKEY_URL', $passkeyurl);
        $viewer->assign('TOTP_URL', $totpurl);
		$viewer->assign('MODULE', $moduleName);
		$viewer->assign('CURRENT_USER_MODEL', Users_Record_Model::getCurrentUserModel());
        return $viewer->view('AddMultiFactorAuthenticationStep1.tpl', 'Users');
    }

    
    public function addMultiFactorAuthenticationStep2(Vtiger_Request $request) {
        $viewer = $this->getViewer($request);
		$moduleName = $request->get('module');
        $userId = $request->get('recordId');
        $type = $request->get('type');

        $currentUserModel = Users_Record_Model::getCurrentUserModel();
        $username = $currentUserModel->get('user_name');
		
        if( $type == "totp") { 
            $secret = Users_MultiFactorAuthentication_Helper::getSecret($type);
            $viewer->assign('SECRET', $secret);
            $viewer->assign('QRCODEURL',Users_MultiFactorAuthentication_Helper::getQRcodeUrl($username, $secret));
        }

        $viewer->assign('VIEW', 'EditAjax');
        $viewer->assign('TYPE', $type);
        
        $viewer->assign('BACK_URL', "javascript:Users_Detail_Js.triggerAddMultiFactorAuthenticationNextStep('index.php?module=Users&view=EditAjax&mode=addMultiFactorAuthenticationStep1&recordId=$userId')");
        $viewer->assign('HOSTNAME', $_SERVER['SERVER_NAME']);
		$viewer->assign('MODULE', $moduleName);
		$viewer->assign('USERID', $userId);
        $viewer->assign('USERNAME', $username);
		$viewer->assign('CURRENT_USER_MODEL', Users_Record_Model::getCurrentUserModel());
        return $viewer->view('AddMultiFactorAuthenticationStep2.tpl', 'Users');
    }
}