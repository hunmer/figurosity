<?php
	header("Access-Control-Allow-Origin: *");
	
	// $_GET = [
	// 	'type' => 'quick-pose',
	// 	'data' => '{"states":["normal"],"gender":[111],"cameras":[1,2,3],"museCount":"single","count":30}'
	// ];

	// $_GET = [
	// 	'type' => 'pose-search',
	// 	'data' => '{"page":1,"models":[],"cameras":[],"gender":[],"style":[],"action":[],"props":[]}'
	// ];	

	switch ($_GET['type']) {
		case 'quick-pose':
			// exit(file_get_contents('cache.json'));
			$url = 'https://api.figurosity.com/public/v1/quickposes/next';
			break;

		case 'pose-search':
			// exit(file_get_contents('pose-search.json'));
			$url = 'https://api.figurosity.com/public/v1/poses';
			break;

		case 'dogs':
			// exit(file_get_contents('pose-search.json'));
			$url = 'https://api.figurosity.com/public/v1/styles/poses/dogs';
			break;

		case 'girls-with-guns-poses':
			// exit(file_get_contents('pose-search.json'));
			$url = 'https://api.figurosity.com/public/v1/styles/poses/girls-with-guns-poses';
			break;		

		case 'superhero-poses':
			// exit(file_get_contents('pose-search.json'));
			$url = 'https://api.figurosity.com/public/v1/styles/poses/superhero-poses';
			break;				

		case 'martial-arts-poses':
			// exit(file_get_contents('pose-search.json'));
			$url = 'https://api.figurosity.com/public/v1/styles/poses/martial-arts-poses';
			break;	
			
		case 'horses':
			// exit(file_get_contents('pose-search.json'));
			$url = 'https://api.figurosity.com/public/v1/styles/poses/horses';
			break;				
		default:
			exit();
	}
	$ch = curl_init();
	$options =  array(
		CURLOPT_HEADER => false,
		CURLOPT_POST => 1,
		CURLOPT_URL => $url,
		CURLOPT_POSTFIELDS => http_build_query(json_decode($_GET['data'], 1)),
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_TIMEOUT => 10,
		CURLOPT_PROXYAUTH => CURLAUTH_BASIC,
		CURLOPT_HTTPHEADER => array(
			'X-FORWARDED-FOR:'.Rand_IP(),
			'CLIENT-IP:'.Rand_IP(),
			'Content-Type' => 'application/json;charset=UTF-8',
			'Origin' => 'https://figurosity.com',
			'Referer' => 'https://figurosity.com/',
			'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36 Edg/86.0.622.38'
		),
		CURLOPT_SSL_VERIFYPEER => false,
		CURLOPT_SSL_VERIFYHOST => false,
	);
	//if($_GET['proxy']){
		$options[CURLOPT_PROXY] = "127.0.0.1";
		$options[CURLOPT_PROXYPORT] = 1080;
	//}
	curl_setopt_array($ch, $options);
	$content = curl_exec($ch);
	curl_close($ch);
	exit($content);
	//var_dump($content); exit();
	//mkdir('./cache/');
	//file_put_contents($s_file, $content);

function Rand_IP(){
	srand(microtime(true));
    return round(rand(600000, 2550000) / 10000).".".round(rand(600000, 2550000) / 10000).".".round(rand(600000, 2550000) / 10000).".".round(rand(600000, 2550000) / 10000);
}