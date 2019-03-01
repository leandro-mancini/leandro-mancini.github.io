<?php
	// recebe as Variaveis
	$nome    = $_POST["nome"];
	$email    = $_POST["email"];
	$mensagem    = $_POST["mensagem"];

	// Inclui o arquivo class.phpmailer.php localizado na pasta phpmailer
	include("class.phpmailer.php");

	// Inicia a classe PHPMailer
	$mail = new PHPMailer();

	// Define os dados do servidor e tipo de conexão
	$mail->IsSMTP();
	$mail->Host     = "smtp.leandromancini.com";     // Endereço do servidor SMTP
	$mail->SMTPAuth = true;                  		 // Usa autenticação SMTP? (opcional)
	$mail->Username = 'contato@leandromancini.com';  // Usuário do servidor SMTP       
	$mail->Password = 'lele35637425884';             // Senha do servidor SMTP
	$mail->Port = 587;

	// Define o remetente.
	$mail->From     = "contato@leandromancini.com"; 		// Seu e-mail
	$mail->FromName = "Portfolio";       						// Seu nome

	// Define os destinatário(s)
	$mail->AddAddress('contato@leandromancini.com');
	//$mail->AddCC('contato@leandromancini.com', 'Eu'); // Copia
	//$mail->AddBCC('fulano@dominio.com.br', 'Fulano da Silva'); // Cópia Oculta

	// Define os dados técnicos da Mensagem
	$mail->IsHTML(true); // Define que o e-mail será enviado como HTML

	// Corpo do email
	$body = '<html><body bgcolor="#f5f3f0" style="font-family:"Trebuchet MS", Verdana; text-align:center;">';
	$body .= '<h1>Portfolio - Contato</h1>';
	$body .= '<p>';
	$body .=	'<strong>Nome:</strong>'.utf8_decode($nome).'<br>';
	$body .=	'<strong>Email:</strong>'.utf8_decode($email).'<br>';
	$body .=	'<strong>Mensagem:</strong>'.utf8_decode($mensagem).'';
	$body .= '</p>';
	$body .= '</body></html>';

	// Define a mensagem (Texto e Assunto)
	$mail->Subject = "Portfolio - Contato"; // Assunto da mensagem
	$mail->Body    = $body;

	// Envia o e-mail
	$enviado = $mail->Send();

	// Exibe uma mensagem de resultado
	if ($enviado) {
	   echo "Ehee!!! E-mail enviado com sucesso!";   
	} else {
	   echo "OOPPSSS!!! Ocorreu um erro, tente novamente mais tarde.";
	}

?>
